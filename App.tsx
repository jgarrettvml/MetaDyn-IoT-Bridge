
import React, { useState, useEffect, useRef } from 'react';
import { bluetoothService } from './services/bluetoothService.ts';
import { geminiLiveService } from './services/geminiLiveService.ts';
import { ConnectionStatus, ChatMessage } from './types.ts';
import { 
  Bluetooth, 
  Mic, 
  Activity, 
  Power,
  Wifi,
  Radio,
  RefreshCw
} from 'lucide-react';

const App: React.FC = () => {
  const [btStatus, setBtStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [aiStatus, setAiStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, inputTranscript, outputTranscript]);

  const connectBridge = async () => {
    try {
      setBtStatus(ConnectionStatus.CONNECTING);
      const name = await bluetoothService.connect();
      setDeviceName(name);
      setBtStatus(ConnectionStatus.CONNECTED);

      setAiStatus(ConnectionStatus.CONNECTING);
      await geminiLiveService.connect({
        onInputTranscription: (text) => setInputTranscript(prev => prev + text),
        onOutputTranscription: (text) => {
          setIsAiSpeaking(true);
          setOutputTranscript(prev => prev + text);
        },
        onTurnComplete: () => {
          setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), sender: 'user', text: inputTranscript, timestamp: new Date() },
            { id: (Date.now() + 1).toString(), sender: 'ai', text: outputTranscript, timestamp: new Date() }
          ]);
          setInputTranscript('');
          setOutputTranscript('');
          setIsAiSpeaking(false);
        },
        onError: (e) => {
          console.error(e);
          setAiStatus(ConnectionStatus.ERROR);
        }
      });
      setAiStatus(ConnectionStatus.CONNECTED);

      await bluetoothService.startNotifications((data) => {
        const pcmData = new Int16Array(data.buffer);
        geminiLiveService.sendAudio(pcmData);
      });

    } catch (err) {
      console.error(err);
      setBtStatus(ConnectionStatus.ERROR);
    }
  };

  const disconnectBridge = async () => {
    await bluetoothService.disconnect();
    await geminiLiveService.disconnect();
    setBtStatus(ConnectionStatus.DISCONNECTED);
    setAiStatus(ConnectionStatus.DISCONNECTED);
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 font-sans selection:bg-[#F29100]/30">
      {/* Background Ambience based on Logo Blue */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0081C9]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#004C83]/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header with MetaDyn Logo */}
      <header className="p-4 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-1 rounded-xl bg-white/5 ring-1 ring-white/10 shadow-lg shadow-black/20">
            <img 
              src="logo.png" 
              alt="MetaDyn Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              IoT <span className="text-[#0081C9]">Bridge</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${btStatus === ConnectionStatus.CONNECTED ? 'bg-[#F29100] animate-pulse shadow-[0_0_8px_#F29100]' : 'bg-slate-600'}`} />
              <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">
                {btStatus === ConnectionStatus.CONNECTED ? 'SECURE LINK' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {btStatus === ConnectionStatus.CONNECTED ? (
          <button 
            onClick={disconnectBridge}
            className="p-3 hover:bg-red-500/10 text-red-400 rounded-xl transition-all group"
          >
            <Power size={22} className="group-active:scale-90 transition-transform" />
          </button>
        ) : (
          <button 
            onClick={connectBridge}
            disabled={btStatus === ConnectionStatus.CONNECTING}
            className="px-6 py-2.5 bg-[#F29100] hover:bg-[#d98200] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-xl shadow-[#F29100]/20 flex items-center gap-2 transition-all active:scale-95 border border-[#F29100]/30"
          >
            {btStatus === ConnectionStatus.CONNECTING ? <RefreshCw className="animate-spin" size={16} /> : <Bluetooth size={16} />}
            {btStatus === ConnectionStatus.CONNECTING ? 'Pairing...' : 'Pair XIAO'}
          </button>
        )}
      </header>

      {/* Main Bridge Console */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* Connection Visualizers */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 && !inputTranscript && !outputTranscript && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-[#0081C9]/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <Radio size={72} className="text-[#0081C9] relative z-10 animate-[pulse_2s_infinite]" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F29100] rounded-full animate-ping z-20 shadow-lg shadow-[#F29100]/50"></div>
              </div>
              <div className="space-y-3 relative z-10">
                <p className="text-slate-300 font-bold tracking-tight text-lg">Bridge Awaiting Audio Uplink</p>
                <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed font-medium">
                  Streaming secure hardware audio from XIAO S3 Sense via the MetaDyn IoT Gateway.
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-md border ${
                m.sender === 'user' 
                  ? 'bg-[#0081C9] text-white border-[#4DB8E9]/30 rounded-tr-none' 
                  : 'bg-slate-900/60 text-slate-200 border-white/5 rounded-tl-none backdrop-blur-md'
              }`}>
                <p className="text-sm leading-relaxed font-medium">{m.text}</p>
              </div>
            </div>
          ))}

          {/* Dynamic Transcripts */}
          {inputTranscript && (
            <div className="flex flex-col items-end opacity-80 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="max-w-[85%] p-4 rounded-2xl bg-[#0081C9]/10 text-[#4DB8E9] rounded-tr-none border border-[#0081C9]/40 backdrop-blur-sm">
                <p className="text-sm italic font-medium">{inputTranscript}</p>
              </div>
              <span className="text-[10px] font-black text-[#0081C9] mt-2 uppercase flex items-center gap-1.5 tracking-widest">
                <Mic size={10} className="animate-bounce" /> Uplink Processing
              </span>
            </div>
          )}

          {outputTranscript && (
            <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="max-w-[85%] p-4 rounded-2xl bg-[#F29100]/5 text-[#F29100] rounded-tl-none border border-[#F29100]/30 backdrop-blur-sm shadow-lg shadow-[#F29100]/5">
                <p className="text-sm italic font-medium">{outputTranscript}</p>
              </div>
              <span className="text-[10px] font-black text-[#F29100] mt-2 uppercase flex items-center gap-1.5 tracking-widest">
                <Activity size={10} className="animate-pulse" /> MetaDyn AI Downlink
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Global Visualizer Section */}
        <div className="p-8 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent">
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="flex items-center gap-2 h-12">
              {[...Array(24)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isAiSpeaking ? 'bg-[#F29100] shadow-[0_0_10px_#F29100]' : 'bg-[#0081C9]/30 h-1'
                  }`}
                  style={{ 
                    animation: isAiSpeaking ? `bounce 0.8s infinite` : 'none',
                    animationDelay: `${i * 0.03}s`, 
                    height: isAiSpeaking ? `${15 + Math.random() * 30}px` : '4px' 
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
              <span className={`transition-colors duration-500 ${isAiSpeaking ? 'text-slate-700' : 'text-[#0081C9]'}`}>
                Hardware Ready
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <span className={`transition-colors duration-500 ${isAiSpeaking ? 'text-[#F29100]' : 'text-slate-700'}`}>
                Downlink Active
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Hardware Status Bar */}
      <nav className="p-4 border-t border-white/5 bg-[#020617] flex justify-around items-center">
        <div className="flex flex-col items-center gap-1.5">
          <div className={`p-3 rounded-2xl transition-all duration-500 ${btStatus === ConnectionStatus.CONNECTED ? 'text-[#0081C9] bg-[#0081C9]/10 shadow-[inset_0_0_15px_rgba(0,129,201,0.2)]' : 'text-slate-800 bg-slate-900/50'}`}>
            <Wifi size={20} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${btStatus === ConnectionStatus.CONNECTED ? 'text-[#0081C9]' : 'text-slate-600'}`}>NODE</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className={`p-3 rounded-2xl transition-all duration-500 ${aiStatus === ConnectionStatus.CONNECTED ? 'text-[#F29100] bg-[#F29100]/10 shadow-[inset_0_0_15px_rgba(242,145,0,0.2)]' : 'text-slate-800 bg-slate-900/50'}`}>
            <Activity size={20} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${aiStatus === ConnectionStatus.CONNECTED ? 'text-[#F29100]' : 'text-slate-600'}`}>GATEWAY</span>
        </div>
      </nav>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scaleY(1); opacity: 0.5; }
          50% { transform: scaleY(1.8); opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
