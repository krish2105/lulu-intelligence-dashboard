interface LiveIndicatorProps {
  isConnected: boolean;
}

export default function LiveIndicator({ isConnected }: LiveIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl glass transition-all duration-300 ${
      isConnected 
        ? 'border border-emerald-500/30' 
        : 'border border-rose-500/30'
    }`}>
      <span className="relative flex h-3 w-3">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${
          isConnected ? 'bg-emerald-500' : 'bg-rose-500'
        }`}></span>
      </span>
      <span className={`text-sm font-semibold ${
        isConnected ? 'text-emerald-400' : 'text-rose-400'
      }`}>
        {isConnected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  );
}
