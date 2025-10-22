import React, { useState, useEffect, useRef } from 'react';

// Welcome text (yeh 'clear' command ke liye zaroori hai)
const initialLines = [
  "Welcome to Mudassir Nadeem's interactive portfolio.",
  "For a list of available commands, type 'help'.",
  ""
];

// --- Helper function for styling history lines ---
// This function adds different colors based on the line content
const renderLine = (line, index) => {
  // 1. User command (lines starting with '>')
  if (line.startsWith('> ')) {
    return (
      <div key={index} className="flex items-center">
        {/* We add the prompt here, and show the command text (without '>') */}
        <span className="text-yellow-400 mr-2 hidden sm:inline">portfolio@mudassir:~$</span>
        <span className="text-yellow-400 mr-2 sm:hidden">&gt;</span> {/* Shorter prompt for mobile */}
        <pre className="text-gray-300 whitespace-pre-wrap text-sm md:text-base">{line.substring(2)}</pre>
      </div>
    );
  }

  // 2. Error messages
  if (line.includes('Oops!')) {
    return <pre key={index} className="text-red-400 whitespace-pre-wrap text-sm md:text-base">{line}</pre>;
  }

  // 3. Titles (like "EXECUTING..." or "COMMANDS LIST:")
  if (line.endsWith('...') || line === 'COMMANDS LIST:') {
    return (
      <pre key={index} className="whitespace-pre-wrap text-sm md:text-base text-cyan-400 [text-shadow:0_0_8px_rgb(34_211_238_/_0.7)] font-medium">
        {line}
      </pre>
    );
  }

  // 4. 'help' command list (colorizes the command and description)
   if (line.trim().startsWith(' ') && line.includes(' - ')) { 
    const parts = line.split(/(\s-\s)/); // Split on ' - '
    return (
      // --- YAHAN SE text-gray-200 HATA DIYA HAI ---
      <pre key={index} className="whitespace-pre-wrap text-sm md:text-base block">
        {/* Fixed-width 'w-28' for alignment, added gradient */}
        <span className="w-28 inline-block text-cyan-400 [text-shadow:0_0_8px_rgb(34_211_238_/_0.7)] font-medium">{parts[0]}</span>
        <span className="text-gray-500">{parts[1]}</span>
        <span className="text-green-400">{parts.slice(2).join('')}</span> 
      </pre>
    )
  }

  // 5. Other lists (skills, projects, experience)
  // We remove this rule so all details fall through to rule #6
  /*
  if (line.trim().startsWith('-') || line.trim().startsWith('**')) { 
    return <pre key={index} className="text-gray-200 whitespace-pre-wrap text-sm md:text-base">{line}</pre>;
  }
  */

  // 6. Default output (Welcome, contact info, etc.)
  return <pre key={index} className="text-green-400 whitespace-pre-wrap text-sm md:text-base">{line}</pre>;
};
// --- End of helper function ---


function Terminal() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]); // --- CHANGED: Start with empty history
  const [isTyping, setIsTyping] = useState(false); // --- NEW: State to lock input

  const inputRef = useRef(null);
  const endOfHistoryRef = useRef(null);

  // --- NEW: Helper function for async delay ---
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // --- NEW: Universal function to type out lines ---
  // --- Note: Is ab `isMounted` check karega ---
  const typeLines = async (lines, isMounted) => {
    setIsTyping(true); // Lock the input
    for (const line of lines) {
      if (!isMounted.current) return; // Agar component unmount ho gaya hai to ruk jayein
      
      setHistory(prev => [...prev, '']); // Add a new, empty line
      
      const charDelay = line.length > 50 ? 2 : 5; // Type faster for long lines

      for (let i = 0; i < line.length; i++) {
        if (!isMounted.current) return; // Har character ke baad check karein
        
        // Update the *last* line in history char by char
        setHistory(prev => {
          const newHist = [...prev];
          newHist[newHist.length - 1] = line.substring(0, i + 1);
          return newHist;
        });
        await delay(charDelay); // Wait 2-5ms between characters
      }
      await delay(50); // Wait 50ms between lines
    }
    if (isMounted.current) {
      setIsTyping(false); // Unlock the input
    }
  };

  // --- UPDATED: useEffect for initial load typing (Strict Mode fix) ---
  useEffect(() => {
    const isMounted = { current: true }; // Ek mutable object (ref ki tarah)
    
    // --- YAHAN FIX ADD KIYA HAI ---
    // Strict Mode mein double-run se bachne ke liye state ko pehle reset karein
    setHistory([]); 
    
    typeLines(initialLines, isMounted); // isMounted ko pass karein

    // Cleanup function
    return () => {
      isMounted.current = false; // Jab component unmount ho (Strict Mode mein hota hai)
    };
  }, []); // Empty array ensures this runs only once on mount

  // Scroll to bottom effect
  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]); // This still works perfectly

  // --- YAHAN ADD KIYA HAI: Global key listener ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Check karein agar input focused nahi hai
      if (inputRef.current && e.target !== inputRef.current) {
        
        // Ctrl+C, Ctrl+V, ya doosre shortcuts ko ignore karein
        if (e.metaKey || e.ctrlKey || e.altKey) {
          return;
        }
        
        // Agar key "printable" hai (jaise 'a', 'b', '1', ' ')
        if (e.key.length === 1) {
          // Input ko focus karein
          inputRef.current.focus();
        }
      }
    };

    // Listener ko poore document pe add karein
    document.addEventListener('keydown', handleGlobalKeyDown);

    // Cleanup function (jab component unmount ho)
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []); // [] ka matlab yeh sirf ek baar run hoga

  // --- UPDATED: Command Handler ---
  const handleCommand = (e) => {
    // Check if Enter is pressed AND we are not currently typing
    if (e.key === 'Enter' && !isTyping) { 
      const newHistory = [...history, `> ${command}`]; // Add user's command
      setHistory(newHistory); // Show user command immediately
      
      let output = []; 

      switch (command?.toLowerCase().trim()) {
        
        case 'help':
          output = [
            "COMMANDS LIST:",
            "  about      - Run `whoami` to get my details.",
            "  skills     - Check out my tech arsenal.",
            "  experience - Access my service record.",
            "  projects   - Inspect my completed builds.",
            "  education  - View my training & qualifications.",
            "  contact    - Open a communication channel.",
            "  clear      - Wipe the slate clean.",
          ];
          break;
        
        case 'about':
          output = [
            "EXECUTING: `whoami`...",
            "  Hey there! I'm Mudassir Nadeem.",
            "  A Software Engineering grad who loves building things.",
            "  I've spent 4 years tinkering with IoT and desktop apps, and now I'm diving",
            "  deep into frontend web development. My goal? To become a full-stack dev.",
            "  I build clean, documented, client-ready solutions.",
          ];
          break;

        case 'skills':
          output = [
            "ACCESSING TECH ARSENAL...",
            "  --- CORE WEAPONS (Web) ---",
            "  - HTML, CSS, JavaScript, React",
            "",
            "  --- BATTLE-TESTED (IoT/Desktop) ---",
            "  - Python (Tkinter/CustomTkinter)",
            "  - Arduino, ESP32, Sensors",
            "",
            "  --- UNIVERSAL PERKS ---",
            "  - Problem-solving & Debugging",
            "  - Project Handling & Time Management",
            "  - Strong Communication & Collaboration",
          ];
          break;

        case 'experience':
          output = [
            "LOADING SERVICE RECORD...",
            "",
            "  ** IoT & DESKTOP DEV @ PaZhong Automations **",
            "  - Duration: Feb 2022 - Aug 2024",
            "  - Mission: Built smart systems (Arduino, ESP32) and Python desktop apps.",
            "  - Delivered cool stuff like solar scrubbers, smart dustbins, and parking systems.",
            "",
            "  ** FREELANCE DEVELOPER (Web/Desktop/IoT) **",
            "  - Duration: 2021 - Present",
            "  - Mission: Took on projects from LinkedIn, Facebook, and university.",
            "  - Built responsive React sites and various Python tools.",
          ];
          break;

        case 'projects':
          output = [
            "INSPECTING COMPLETED BUILDS...",
            "  Here's a log of systems I've brought to life:",
            "  - Deployed smart solar scrubbers.",
            "  - Engineered automated smart dustbins.",
            "  - Implemented intelligent parking systems.",
            "  - Built various responsive websites using React.",
            "  - Crafted custom desktop tools using Python (Tkinter).",
          ];
          break;

        case 'education':
          output = [
            "QUERYING QUALIFICATIONS...",
            "  - BS Software Engineering",
            "  - The Islamia University of Bahawalpur (IUB)",
            "  - Graduation Year: 2025",
          ];
          break;

        case 'contact':
          output = [
            "OPENING COMMUNICATION CHANNEL...",
            "  - Phone: +92 319 1001847",
            "  - Email: heyimudassir@gmail.com",
            "  - Web: ohmudassir.netlify.app",
            "  - Base: Bahawalnagar",
          ];
          break;

        case 'clear':
          setHistory([]); // Clear history completely
          typeLines(initialLines, { current: true }); // Re-type the welcome message
          setCommand('');
          return; // Return to stop further processing
        
        default:
          output = [
            `Oops! Command '${command}' not recognized.`,
            `Are you sure that's correct? Type 'help' for a list of commands.`
          ];
          break;
      }
      
      // --- UPDATED: Start typing the output, then add a blank line ---
      // We pass the output array + a blank line to the typeLines function
      typeLines([...output, ""], { current: true }); // Har command ke liye naya 'isMounted'
      setCommand(''); 
    }
  };

  return (
    // Main page container - centers the terminal and adds gradient
    <div 
      className="min-h-screen text-white p-4 flex justify-center items-center 
                 bg-gradient-to-br from-teal-900 to-purple-900" // Added gradient classes here
    >
      {/* Terminal Window --- YAHAN CHANGE KIYA HAI --- */}
      <div 
        className="w-full max-w-4xl h-[90vh] bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl overflow-hidden font-mono flex flex-col" // Glassmorphism classes
        onClick={() => inputRef.current?.focus()} // Click anywhere in the window to focus
      >
        {/* Header Bar --- YAHAN CHANGE KIYA HAI --- */}
        <div className="bg-black/20 p-3 flex items-center rounded-t-lg flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <div className="flex-1 text-center text-gray-400 text-sm font-sans">
            heyimudassir -- bash
          </div>
        </div>

        {/* Terminal Body (Scrolling History) --- YAHAN CHANGE KIYA HAI --- */}
        <div 
          className="flex-grow overflow-y-auto p-4 scrollbar-none [&::-webkit-scrollbar]:hidden" // Scrollbar hide classes
        >
          {history.map(renderLine)} {/* Use the new render function */}
          <div ref={endOfHistoryRef} />
        </div>
        
        {/* Input Area (Fixed at bottom) --- YAHAN CHANGE KIYA HAI --- */}
        <div className="bg-black/20 p-4 rounded-b-lg flex-shrink-0">
          <div className="flex items-center text-green-400 text-sm md:text-base">
            <span className="text-yellow-400 mr-2 hidden sm:inline">portfolio@mudassir:~$</span>
            <span className="text-yellow-400 mr-2 sm:hidden">&gt;</span> {/* Shorter prompt for mobile */}
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleCommand}
              autoFocus
              // --- UPDATED: Disable input while typing ---
              disabled={isTyping} 
              className="flex-1 bg-transparent border-none outline-none text-inherit caret-green-400
                         disabled:opacity-50" // Make it look disabled
              placeholder={isTyping ? "..." : "Type 'help' and press Enter"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terminal;

