import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
  isEdited?: boolean;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
  isGroup?: boolean;
  members?: string[];
  importedFrom?: 'whatsapp';
}

const Index = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [whatsappData, setWhatsappData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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
        isMine: true,
        type: 'text'
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const startEditMessage = (msg: Message) => {
    if (msg.type === 'text' && msg.text) {
      setEditingMessageId(msg.id);
      setEditingText(msg.text);
    }
  };

  const saveEditMessage = () => {
    if (editingText.trim() && editingMessageId) {
      setMessages(messages.map(msg => 
        msg.id === editingMessageId 
          ? { ...msg, text: editingText, isEdited: true }
          : msg
      ));
      setEditingMessageId(null);
      setEditingText('');
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const deleteMessage = (messageId: number) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
  };

  const createGroup = () => {
    if (groupName.trim()) {
      const members = groupMembers.split(',').map(m => m.trim()).filter(m => m);
      const newGroup: Chat = {
        id: chats.length + 1,
        name: groupName,
        avatar: '👥',
        lastMessage: 'Группа создана',
        time: 'Только что',
        isGroup: true,
        members: members.length > 0 ? members : undefined
      };
      setChats([newGroup, ...chats]);
      setGroupName('');
      setGroupMembers('');
    }
  };

  const importWhatsAppGroup = () => {
    if (!whatsappData.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Вставьте данные группы WhatsApp',
        variant: 'destructive'
      });
      return;
    }

    const lines = whatsappData.split('\n').filter(line => line.trim());
    const groupNameMatch = lines[0]?.match(/Группа[:\s]+(.+)/) || lines[0]?.match(/Group[:\s]+(.+)/);
    const extractedGroupName = groupNameMatch ? groupNameMatch[1].trim() : 'Импортированная группа';
    
    const members: string[] = [];
    lines.forEach(line => {
      const memberMatch = line.match(/[+\d\s()\-]+[:\s]+(.+)/) || line.match(/^([А-Яа-яA-Za-z\s]+)$/);
      if (memberMatch && memberMatch[1]) {
        const memberName = memberMatch[1].trim();
        if (memberName && !memberName.includes('Группа') && !memberName.includes('Group')) {
          members.push(memberName);
        }
      }
    });

    const newGroup: Chat = {
      id: chats.length + 1,
      name: extractedGroupName,
      avatar: '💬',
      lastMessage: `Импортировано ${members.length} участников из WhatsApp`,
      time: 'Только что',
      isGroup: true,
      members: members,
      importedFrom: 'whatsapp'
    };

    setChats([newGroup, ...chats]);
    setWhatsappData('');
    setShowImportDialog(false);
    
    toast({
      title: 'Успешно!',
      description: `Группа "${extractedGroupName}" импортирована с ${members.length} участниками`
    });
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                  <Icon name="Plus" size={24} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Icon name="Users" size={16} className="mr-2" />
                      Создать группу
                    </DropdownMenuItem>
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
                        <Label htmlFor="members">Участники (через запятую)</Label>
                        <Input 
                          id="members" 
                          placeholder="Иван, Мария, Петр..." 
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
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Icon name="Download" size={16} className="mr-2" />
                      Импортировать из WhatsApp
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Icon name="MessageCircle" size={24} className="text-green-600" />
                        Импорт группы из WhatsApp
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-medium text-blue-900">📱 Как экспортировать группу из WhatsApp:</p>
                        <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                          <li>Откройте групповой чат в WhatsApp</li>
                          <li>Нажмите на название группы вверху</li>
                          <li>Выберите "Экспортировать чат" → "Без медиа"</li>
                          <li>Скопируйте текст и вставьте сюда</li>
                        </ol>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsappData">Данные группы WhatsApp</Label>
                        <Textarea 
                          id="whatsappData" 
                          placeholder="Вставьте экспортированные данные группы WhatsApp...&#10;&#10;Например:&#10;Группа: Рабочая команда&#10;+7 900 123-45-67: Иван Петров&#10;+7 900 765-43-21: Мария Смирнова&#10;..." 
                          value={whatsappData}
                          onChange={(e) => setWhatsappData(e.target.value)}
                          className="min-h-[200px] font-mono text-xs"
                        />
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={importWhatsAppGroup}>
                        <Icon name="Download" size={18} className="mr-2" />
                        Импортировать группу
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                      {chat.importedFrom === 'whatsapp' && chat.members && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            <Icon name="MessageCircle" size={10} className="mr-1" />
                            {chat.members.length}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {chat.unread && (
                      <span className="px-2 py-0.5 bg-gradient-accent text-white text-xs font-semibold rounded-full shrink-0">
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground">{selectedChat.name}</h2>
                    {selectedChat.importedFrom === 'whatsapp' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Icon name="MessageCircle" size={12} className="mr-1" />
                        WhatsApp
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.isGroup ? (
                      selectedChat.members ? `${selectedChat.members.length} участников` : 'Групповой чат'
                    ) : 'В сети'}
                  </p>
                </div>
                {selectedChat.isGroup && selectedChat.members && selectedChat.members.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <Icon name="Info" size={20} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Icon name="Users" size={24} />
                          Участники группы
                        </DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {selectedChat.members.map((member, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gradient-primary text-white text-sm">
                                  {member.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{member}</p>
                                <p className="text-xs text-muted-foreground">Участник</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} animate-fade-in group`}
                >
                  <div className="flex items-start gap-2 max-w-[70%]">
                    {msg.isMine && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icon name="MoreVertical" size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {msg.type === 'text' && (
                            <DropdownMenuItem onClick={() => startEditMessage(msg)}>
                              <Icon name="Edit" size={16} className="mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => deleteMessage(msg.id)} className="text-red-600">
                            <Icon name="Trash2" size={16} className="mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
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
                      <div>
                        <p className={msg.isMine ? 'text-white' : 'text-foreground'}>{msg.text}</p>
                        {msg.isEdited && (
                          <p className={`text-xs italic mt-1 ${msg.isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
                            изменено
                          </p>
                        )}
                      </div>
                    )}
                    
                    {msg.type === 'text' && (
                      <p className={`text-xs mt-1 ${msg.isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {msg.time}
                      </p>
                    )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-white/80 backdrop-blur-sm">
              {editingMessageId ? (
                <div className="flex items-center gap-2 bg-blue-50 rounded-2xl p-4 animate-fade-in">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Редактирование сообщения</p>
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEditMessage()}
                      className="bg-white"
                      autoFocus
                    />
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={cancelEdit}
                  >
                    <Icon name="X" size={20} />
                  </Button>
                  <Button 
                    size="icon" 
                    className="bg-gradient-accent"
                    onClick={saveEditMessage}
                  >
                    <Icon name="Check" size={20} />
                  </Button>
                </div>
              ) : isRecording ? (
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