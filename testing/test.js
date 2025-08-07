const { useState, useEffect, useRef } = React;

const getNextWeekDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const QuoteSystem = () => {
  // Get URL parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const result = {
      name: params.get('name') || 'Valued Customer',
      original: parseFloat(params.get('original_price')) || parseFloat(params.get('original')) || 1000,
      discount: parseInt(params.get('discount')) || 25,
      quoteId: params.get('quote_id') || params.get('quoteId') || 'AS-2025-001',
      validUntil: params.get('validUntil') || getNextWeekDate()
    };
    return result;
  };

  const [config, setConfig] = useState(getUrlParams());
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBouncing, setIsBouncing] = useState(true);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Calculate derived values
  const discountedPrice = config.original * (1 - config.discount / 100);
  const savings = config.original - discountedPrice;

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    // Update config if URL changes
    const handlePopState = () => {
      setConfig(getUrlParams());
      setIsRevealed(false);
      setIsBouncing(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    canvas.width = 400;
    canvas.height = 250;
    initCanvas();
  }, [config, isRevealed]);

  const initCanvas = () => {
    if (!ctxRef.current || isRevealed) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(0.5, '#e2e8f0');
    gradient.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ATLANTIC SECURITY', canvas.width/2, canvas.height/2 - 25);
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Reveal your exclusive offer', canvas.width/2, canvas.height/2 + 10);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  };

  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const scratch = (x, y) => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
  };

  const calculateScratchedPercentage = () => {
    if (!ctxRef.current) return 0;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) {
        transparent++;
      }
    }
    return (transparent / (pixels.length / 4)) * 100;
  };

  const handleScratchStart = (e) => {
    if (isRevealed) return;
    setIsDrawing(true);
    setIsBouncing(false);
    const pos = getEventPos(e);
    scratch(pos.x, pos.y);
  };

  const handleScratchMove = (e) => {
    if (!isDrawing || isRevealed) return;
    e.preventDefault();
    const pos = getEventPos(e);
    scratch(pos.x, pos.y);
    const scratchedPercentage = calculateScratchedPercentage();
    if (scratchedPercentage > 70) {
      setIsDrawing(false);
      setTimeout(() => setIsRevealed(true), 200);
    }
  };

  const handleScratchEnd = () => {
    setIsDrawing(false);
  };

  const handleAcceptQuote = () => {
    alert(`Quote accepted for ${config.name}! Your discounted price: $${discountedPrice.toFixed(2)}\n\nThank you for choosing Atlantic Security. A specialist will contact you within 24 hours to schedule your consultation and installation.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#0a174e] flex items-center justify-center p-4 transition-colors duration-1000">
      <div className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full border border-white/20 transition-all duration-1000 ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        {/* Header: Only logo */}
        <div className="relative p-8 flex items-center justify-between bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-t-3xl shadow-md">
          <img src="./logo.png" alt="Atlantic Security Logo" className="w-16 h-16 rounded-xl shadow-lg bg-white/80 p-1" />
          <div className="text-right">
            <div className="text-sm text-blue-100 font-medium">Valid Until</div>
            <div className="font-mono text-blue-50 font-semibold">{config.validUntil}</div>
          </div>
        </div>
        {/* Main Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Exclusive Offer for {config.name}
            </h2>
            <p className="text-slate-600 text-lg">
              We've prepared a special discount for your security needs
            </p>
          </div>
          {/* Price Comparison */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 mb-8 border border-slate-200/50">
            <div className="flex items-center justify-center space-x-8 mb-4">
              <div className="text-center">
                <div className="text-sm text-slate-500 mb-1">Original Price</div>
                <div className="text-2xl font-bold text-slate-400 line-through">${config.original.toFixed(2)}</div>
              </div>
              <div className="text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-500 mb-1">Your Discount</div>
                <div className="text-2xl font-bold text-green-600">{config.discount}% OFF</div>
              </div>
            </div>
            <div className="text-center text-slate-600">
              <span className="font-medium">Quote ID:</span> {config.quoteId}
            </div>
          </div>
          {/* Scratch Card */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <p className="text-slate-600 font-medium">Reveal your exclusive price below</p>
            </div>
            <div className="relative w-full max-w-md mx-auto">
              <div className={`relative w-96 h-60 mx-auto rounded-2xl overflow-hidden shadow-xl ${isBouncing ? 'animate-card-bounce' : ''}`}>
                {/* Revealed content */}
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex flex-col items-center justify-center text-white transition-all duration-700 ${
                  isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}>
                  <div className="text-4xl font-bold mb-2">${discountedPrice.toFixed(2)}</div>
                  <div className="text-lg text-blue-100 mb-3">Your Special Price</div>
                  <div className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
                    Save ${savings.toFixed(2)}
                  </div>
                </div>
                {/* Scratch canvas */}
                {!isRevealed && (
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 cursor-crosshair z-10"
                    onMouseDown={handleScratchStart}
                    onMouseMove={handleScratchMove}
                    onMouseUp={handleScratchEnd}
                    onMouseLeave={handleScratchEnd}
                    onTouchStart={handleScratchStart}
                    onTouchMove={handleScratchMove}
                    onTouchEnd={handleScratchEnd}
                  />
                )}
              </div>
            </div>
          </div>
          {/* CTA Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleAcceptQuote}
              disabled={!isRevealed}
              className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                isRevealed 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isRevealed ? 'Accept This Quote' : 'Scratch to Reveal Price'}
            </button>
          </div>
          {/* Reveal Message */}
          {isRevealed && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8 animate-fade-in">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700 mb-4">
                  Congratulations! You've unlocked your exclusive offer
                </div>
                <div className="text-lg text-green-600 mb-6">
                  Your discounted quote: <span className="font-bold">${discountedPrice.toFixed(2)}</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-green-200">
                  <h4 className="text-green-700 font-bold text-lg mb-4">Package Includes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {[
                      'Professional Installation & Setup',
                      '24/7 System Monitoring', 
                      'Mobile App Access',
                      'Priority Customer Support',
                      '12-Month Comprehensive Warranty',
                      'Free System Training Session'
                    ].map((service, index) => (
                      <div key={index} className="flex items-center text-green-700">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {service}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Contact Section */}
          <div className="text-center pt-6 border-t border-slate-200">
            <p className="text-slate-600 mb-4">Questions about your quote?</p>
            <div className="flex justify-center space-x-4">
              <a href="tel:+1234567890" className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-300 font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us
              </a>
              <a href="mailto:quotes@atlanticsecurity.com" className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-300 font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Custom styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        .animate-fade-in { 
          animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        @keyframes card-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-card-bounce {
          animation: card-bounce 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Render the app
ReactDOM.render(<QuoteSystem />, document.getElementById('root'));