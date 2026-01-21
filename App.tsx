
import React, { useState, useEffect, useRef } from 'react';
import { bluetoothService } from './services/bluetoothService.ts';
import { geminiLiveService } from './services/geminiLiveService.ts';
import { ConnectionStatus, ChatMessage } from './types.ts';
import { 
  Bluetooth, 
  BluetoothOff, 
  Mic, 
  Activity, 
  Cpu, 
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

      // Start receiving chunks from XIAO
      await bluetoothService.startNotifications((data) => {
        // XIAO should send 16-bit PCM at 16kHz
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
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Decorative Blur */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20">
            <Cpu size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">XIAO Bridge</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${btStatus === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                {btStatus === ConnectionStatus.CONNECTED ? 'System Online' : 'System Offline'}
              </span>
            </div>
          </div>
        </div>

        {btStatus === ConnectionStatus.CONNECTED ? (
          <button 
            onClick={disconnectBridge}
            className="p-3 hover:bg-red-500/10 text-red-400 rounded-full transition-all group"
          >
            <Power size={20} className="group-active:scale-90 transition-transform" />
          </button>
        ) : (
          <button 
            onClick={connectBridge}
            disabled={btStatus === ConnectionStatus.CONNECTING}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-900/40 flex items-center gap-2 transition-all active:scale-95"
          >
            {btStatus === ConnectionStatus.CONNECTING ? <RefreshCw className="animate-spin" size={16} /> : <Bluetooth size={16} />}
            {btStatus === ConnectionStatus.CONNECTING ? 'Searching...' : 'Pair XIAO'}
          </button>
        )}
      </header>

      {/* Main Experience */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 && !inputTranscript && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Radio size={48} className="animate-pulse" />
              <p className="text-sm max-w-[200px]">Connected to XIAO S3 Sense. Listening to PDM microphone...</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                m.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}

          {/* Ghost Transcripts */}
          {inputTranscript && (
            <div className="flex flex-col items-end opacity-60">
              <div className="max-w-[85%] p-4 rounded-2xl bg-blue-500/20 text-blue-100 rounded-tr-none border border-blue-500/30">
                <p className="text-sm italic">{inputTranscript}</p>
              </div>
              <span className="text-[10px] font-bold text-blue-400 mt-2 uppercase flex items-center gap-1">
                <Mic size={10} className="animate-bounce" /> Transcribing Hardware Audio...
              </span>
            </div>
          )}

          {outputTranscript && (
            <div className="flex flex-col items-start">
              <div className="max-w-[85%] p-4 rounded-2xl bg-slate-800 text-slate-300 rounded-tl-none border border-green-500/20">
                <p className="text-sm italic">{outputTranscript}</p>
              </div>
              <span className="text-[10px] font-bold text-green-400 mt-2 uppercase flex items-center gap-1">
                <Activity size={10} className="animate-pulse" /> AI Synthesis Active
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Visual Feedback Footer */}
        <div className="p-8 bg-gradient-to-t from-slate-900 to-transparent">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 bg-blue-500 rounded-full transition-all duration-150 ${
                    isAiSpeaking ? 'animate-[bounce_0.5s_infinite]' : 'h-1 opacity-20'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s`, height: isAiSpeaking ? `${15 + Math.random() * 20}px` : '4px' }}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-4">
            {isAiSpeaking ? 'Gemini Speaking' : btStatus === ConnectionStatus.CONNECTED ? `Tethered to ${deviceName}` : 'Hardware Tether Required'}
          </p>
        </div>
      </main>

      {/* Floating Status Bar (Mobile-style) */}
      <nav className="p-4 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl flex justify-around items-center">
        <div className="flex flex-col items-center gap-1">
          <div className={`p-2 rounded-lg ${btStatus === ConnectionStatus.CONNECTED ? 'text-blue-400 bg-blue-400/10' : 'text-slate-600'}`}>
            <Wifi size={20} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tighter">BLE Link</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className={`p-2 rounded-lg ${aiStatus === ConnectionStatus.CONNECTED ? 'text-green-400 bg-green-400/10' : 'text-slate-600'}`}>
            <Activity size={20} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tighter">AI Node</span>
        </div>
      </nav>
    </div>
  );
};

export default App;
