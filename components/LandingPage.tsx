
import React from 'react';
import { MousePointer2, Type, Image as ImageIcon, Download, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Line Art Accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full -z-10 opacity-10 pointer-events-none">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <path d="M0,200 Q100,50 200,200 T400,200" fill="none" stroke="black" strokeWidth="2" />
          <path d="M0,250 Q100,100 200,250 T400,250" fill="none" stroke="black" strokeWidth="2" />
          <circle cx="300" cy="100" r="50" fill="none" stroke="black" strokeWidth="2" />
          <rect x="50" y="300" width="100" height="100" fill="none" stroke="black" strokeWidth="2" transform="rotate(45 100 350)" />
        </svg>
      </div>

      <header className="container mx-auto px-6 py-8 flex justify-between items-center border-b-2 border-black">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-xl">C</div>
          <span className="font-grotesk font-bold text-2xl tracking-tight">COVERART</span>
        </div>
        <button 
          onClick={onStart}
          className="line-art-btn px-6 py-2 font-bold uppercase tracking-widest text-sm bg-white"
        >
          Go to Studio
        </button>
      </header>

      <main className="container mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl lg:text-8xl font-grotesk font-bold leading-none">
              CREATE <br />
              <span className="text-white bg-black px-2">ARTWORK</span> <br />
              COVERS.
            </h1>
            <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
              A minimalist design engine for creators. High-impact typography, precision controls, and a sophisticated line-art aesthetic.
            </p>
            <div className="flex space-x-4 pt-4">
              <button 
                onClick={onStart}
                className="line-art-btn bg-black text-white px-8 py-4 font-bold text-lg uppercase flex items-center space-x-3"
              >
                <span>Launch Editor</span>
                <Sparkles size={20} />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="line-art-border bg-white p-4 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img 
                src="https://picsum.photos/800/800?grayscale" 
                alt="Demo" 
                className="w-full grayscale border-2 border-black"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bebas text-8xl drop-shadow-2xl">
                RAW SOUL
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 border-2 border-black -z-10"></div>
          </div>
        </div>

        <section className="mt-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Type, title: "Rich Typography", desc: "Access premium fonts and deep text styling controls." },
            { icon: ImageIcon, title: "Custom Assets", desc: "Upload your own backgrounds or choose from curated stickers." },
            { icon: MousePointer2, title: "Precision Drag", desc: "Fluid, real-time element manipulation with rotation and scaling." },
            { icon: Download, title: "High-Res Export", desc: "Download your masterpieces in crystal-clear quality." },
          ].map((feature, idx) => (
            <div key={idx} className="line-art-border p-8 bg-white space-y-4">
              <feature.icon size={32} />
              <h3 className="font-bold text-xl uppercase font-grotesk">{feature.title}</h3>
              <p className="text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t-2 border-black py-12 mt-20">
        <div className="container mx-auto px-6 text-center text-sm font-bold tracking-widest text-gray-400">
          © 2024 COVERART STUDIO. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
