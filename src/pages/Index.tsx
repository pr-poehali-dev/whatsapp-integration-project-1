import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Message {
  id: number;
  text?: string;
  sender: string;
  time: string;
  isMine: boolean;
  type?: 'text' | 'voice' | 'file';
  fileName?: string;
  fileSize?: string;
  duration?: string;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
  isGroup?: boolean;
}

const Index = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [chats, setChats] = useState<Chat[]>([
    { id: 1, name: 'Анна Смирнова', avatar: '👩‍💼', lastMessage: 'Привет! Как дела?', time: '10:30', unread: 2 },
    { id: 2, name: 'Дизайн команда', avatar: '🎨', lastMessage: 'Посмотрите новый макет', time: '09:15', unread: 5, isGroup: true },
    { id: 3, name: 'Иван Петров', avatar: '👨‍💻', lastMessage: 'Завтра встреча в 15:00', time: 'Вчера' },
    { id: 4, name: 'Маркетинг', avatar: '📊', lastMessage: 'Отчет готов', time: 'Вчера', isGroup: true },
    { id: 5, name: 'Мария Козлова', avatar: '👩‍🎨', lastMessage: 'Спасибо за помощь!', time: '15/12' },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Привет! Как дела?', sender: 'Анна', time: '10:25', isMine: false, type: 'text' },
    { id: 2, text: 'Отлично! А у тебя?', sender: 'Я', time: '10:27', isMine: true, type: 'text' },
    { id: 3, text: 'Тоже хорошо! Скоро встречаемся?', sender: 'Анна', time: '10:30', isMine: false, type: 'text' },
    { id: 4, sender: 'Анна', time: '10:32', isMine: false, type: 'voice', duration: '0:15' },
    { id: 5, sender: 'Я', time: '10:35', isMine: true, type: 'file', fileName: 'Презентация.pdf', fileSize: '2.4 MB' },
  ]);

  const sendMessage = () => {
    if (message.trim() && selectedChat) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: message,
        sender: 'Я',
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isMine: true
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const createGroup = () => {
    if (groupName.trim()) {
      const newGroup: Chat = {
        id: chats.length + 1,
        name: groupName,
        avatar: '👥',
        lastMessage: 'Группа создана',
        time: 'Только что',
        isGroup: true
      };
      setChats([newGroup, ...chats]);
      setGroupName('');
      setGroupMembers('');
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (selectedChat && recordingTime > 0) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: 'Я',
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        type: 'voice',
        duration: `0:${recordingTime.toString().padStart(2, '0')}`
      };
      setMessages([...messages, newMessage]);
    }
    setRecordingTime(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedChat) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: 'Я',
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        type: 'file',
        fileName: file.name,
        fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      };
      setMessages([...messages, newMessage]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="w-full md:w-96 border-r border-border bg-white/80 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-border bg-gradient-primary">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Чаты</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                  <Icon name="Plus" size={24} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать групповой чат</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Название группы</Label>
                    <Input 
                      id="groupName" 
                      placeholder="Введите название..." 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="members">Участники</Label>
                    <Input 
                      id="members" 
                      placeholder="Добавить участников..." 
                      value={groupMembers}
                      onChange={(e) => setGroupMembers(e.target.value)}
                    />
                  </div>
                  <Button className="w-full bg-gradient-primary" onClick={createGroup}>
                    Создать группу
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <Input 
              placeholder="Поиск чатов..." 
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 border-b border-border cursor-pointer transition-all hover:bg-purple-50 ${
                selectedChat?.id === chat.id ? 'bg-gradient-to-r from-purple-100 to-pink-100' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl bg-gradient-primary text-white">
                      {chat.avatar}
                    </AvatarFallback>
                  </Avatar>
                  {chat.isGroup && (
                    <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
                      <Icon name="Users" size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    {chat.unread && (
                      <span className="ml-2 px-2 py-0.5 bg-gradient-accent text-white text-xs font-semibold rounded-full">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-border bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xl bg-gradient-primary text-white">
                    {selectedChat.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground">{selectedChat.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.isGroup ? 'Групповой чат' : 'В сети'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.isMine
                        ? 'bg-gradient-primary text-white'
                        : 'bg-white border border-border'
                    }`}
                  >
                    {!msg.isMine && msg.type === 'text' && (
                      <p className="text-xs font-semibold mb-1 text-primary">{msg.sender}</p>
                    )}
                    
                    {msg.type === 'voice' ? (
                      <div className="flex items-center gap-3">
                        {!msg.isMine && (
                          <p className="text-xs font-semibold text-primary mb-1 absolute -top-4 left-0">{msg.sender}</p>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={`h-8 w-8 ${msg.isMine ? 'text-white hover:bg-white/20' : 'hover:bg-purple-100'}`}
                        >
                          <Icon name="Play" size={16} />
                        </Button>
                        <div className="flex-1">
                          <div className={`h-1 rounded-full ${msg.isMine ? 'bg-white/30' : 'bg-gray-200'}`}>
                            <div className={`h-full w-1/3 rounded-full ${msg.isMine ? 'bg-white' : 'bg-primary'}`} />
                          </div>
                        </div>
                        <span className={`text-xs ${msg.isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {msg.duration}
                        </span>
                      </div>
                    ) : msg.type === 'file' ? (
                      <div className="flex items-center gap-3">
                        {!msg.isMine && (
                          <p className="text-xs font-semibold text-primary mb-1 absolute -top-4 left-0">{msg.sender}</p>
                        )}
                        <div className={`p-2 rounded-lg ${msg.isMine ? 'bg-white/20' : 'bg-purple-100'}`}>
                          <Icon name="FileText" size={24} className={msg.isMine ? 'text-white' : 'text-primary'} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${msg.isMine ? 'text-white' : 'text-foreground'}`}>
                            {msg.fileName}
                          </p>
                          <p className={`text-xs ${msg.isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {msg.fileSize}
                          </p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={`h-8 w-8 ${msg.isMine ? 'text-white hover:bg-white/20' : 'hover:bg-purple-100'}`}
                        >
                          <Icon name="Download" size={16} />
                        </Button>
                      </div>
                    ) : (
                      <p className={msg.isMine ? 'text-white' : 'text-foreground'}>{msg.text}</p>
                    )}
                    
                    {msg.type === 'text' && (
                      <p className={`text-xs mt-1 ${msg.isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {msg.time}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-white/80 backdrop-blur-sm">
              {isRecording ? (
                <div className="flex items-center gap-3 bg-red-50 rounded-2xl p-4 animate-fade-in">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Идёт запись...</p>
                    <p className="text-xs text-muted-foreground">0:{recordingTime.toString().padStart(2, '0')}</p>
                  </div>
                  <Button 
                    size="icon" 
                    className="shrink-0 bg-red-500 hover:bg-red-600"
                    onClick={stopRecording}
                  >
                    <Icon name="StopCircle" size={20} />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon name="Paperclip" size={20} />
                  </Button>
                  <Input
                    placeholder="Напишите сообщение..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" className="shrink-0">
                    <Icon name="Smile" size={20} />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="shrink-0"
                    onClick={startRecording}
                  >
                    <Icon name="Mic" size={20} />
                  </Button>
                  <Button 
                    size="icon" 
                    className="shrink-0 bg-gradient-accent hover:opacity-90"
                    onClick={sendMessage}
                  >
                    <Icon name="Send" size={20} />
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl">💬</div>
              <h2 className="text-2xl font-bold text-foreground">Выберите чат</h2>
              <p className="text-muted-foreground">Начните общение с друзьями и коллегами</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;