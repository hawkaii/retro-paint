import React from 'react';
import Windows98ScrollContainer from './Windows98ScrollContainer';

const ScrollDemo: React.FC = () => {
  return (
    <div className="p-4 bg-gray-300" style={{ fontFamily: 'MS Sans Serif, monospace' }}>
      <h2 className="text-lg font-bold mb-4 windows98-text">Windows 98 Scroll Container Demo</h2>
      
      <div className="flex flex-wrap gap-4">
        {/* Default Container */}
        <div>
          <h3 className="text-sm font-bold mb-2 windows98-text">Default Container (300x200)</h3>
          <Windows98ScrollContainer>
            <h3>System Information</h3>
            <p>Microsoft Windows 98 Second Edition</p>
            <p>Version 4.10.2222 A</p>
            <p>Copyright © 1981-1999 Microsoft Corporation</p>
            
            <h3>Computer Details</h3>
            <ul>
              <li>Processor: Intel Pentium III 500 MHz</li>
              <li>Memory: 128 MB RAM</li>
              <li>Graphics: ATI Rage 128 Pro</li>
              <li>Sound: Creative Sound Blaster Live!</li>
              <li>Network: 3Com EtherLink III</li>
            </ul>
            
            <h3>Installed Programs</h3>
            <ul>
              <li>Microsoft Office 2000</li>
              <li>Internet Explorer 5.5</li>
              <li>Windows Media Player 7</li>
              <li>RealPlayer 8</li>
              <li>WinZip 8.0</li>
              <li>Adobe Acrobat Reader 4.0</li>
              <li>Norton AntiVirus 2000</li>
              <li>ICQ 2000b</li>
              <li>Napster 2.0</li>
            </ul>
            
            <h3>System Files</h3>
            <p>C:\WINDOWS\SYSTEM\KERNEL32.DLL</p>
            <p>C:\WINDOWS\SYSTEM\USER32.DLL</p>
            <p>C:\WINDOWS\SYSTEM\GDI32.DLL</p>
            <p>C:\WINDOWS\SYSTEM\SHELL32.DLL</p>
            <p>C:\WINDOWS\SYSTEM\COMCTL32.DLL</p>
            
            <h3>Registry Information</h3>
            <p>HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion</p>
            <p>ProductName: Microsoft Windows 98</p>
            <p>Version: 4.10.2222</p>
            <p>RegisteredOwner: Retro User</p>
            <p>RegisteredOrganization: Home Computer</p>
            
            <p>This container demonstrates the authentic Windows 98 scrolling experience with proper beveled borders, classic gray color scheme, and pixelated scrollbar elements.</p>
          </Windows98ScrollContainer>
        </div>

        {/* Small Container */}
        <div>
          <h3 className="text-sm font-bold mb-2 windows98-text">Small Container (200x150)</h3>
          <Windows98ScrollContainer className="small">
            <h3>Quick Info</h3>
            <p>Windows 98 was released on June 25, 1998.</p>
            <p>It was the successor to Windows 95.</p>
            <p>Notable features included:</p>
            <ul>
              <li>Internet Explorer 4.0 integration</li>
              <li>Active Desktop</li>
              <li>FAT32 file system support</li>
              <li>USB support</li>
              <li>Multiple monitor support</li>
              <li>Windows Driver Model</li>
            </ul>
            <p>The operating system was known for its stability improvements over Windows 95.</p>
          </Windows98ScrollContainer>
        </div>

        {/* Large Container */}
        <div>
          <h3 className="text-sm font-bold mb-2 windows98-text">Large Container (400x300)</h3>
          <Windows98ScrollContainer className="large">
            <h3>Detailed System Report</h3>
            <p>Generated on: March 15, 1999 at 2:30 PM</p>
            
            <h3>Hardware Configuration</h3>
            <ul>
              <li><strong>Motherboard:</strong> ASUS P3B-F (Intel 440BX chipset)</li>
              <li><strong>Processor:</strong> Intel Pentium III 500 MHz (Katmai core)</li>
              <li><strong>Cache:</strong> 512 KB L2 cache</li>
              <li><strong>Memory:</strong> 128 MB PC100 SDRAM</li>
              <li><strong>Graphics:</strong> ATI Rage 128 Pro 32MB AGP</li>
              <li><strong>Sound:</strong> Creative Sound Blaster Live! Value</li>
              <li><strong>Network:</strong> 3Com EtherLink III 10/100 PCI</li>
              <li><strong>Storage:</strong> Western Digital Caviar 13.6 GB IDE</li>
              <li><strong>Optical:</strong> Creative CD-ROM 52x</li>
              <li><strong>Floppy:</strong> 3.5" 1.44 MB</li>
            </ul>
            
            <h3>Software Environment</h3>
            <p><strong>Operating System:</strong> Microsoft Windows 98 Second Edition</p>
            <p><strong>Version:</strong> 4.10.2222 A</p>
            <p><strong>Build Date:</strong> April 23, 1999</p>
            <p><strong>Service Pack:</strong> None required</p>
            
            <h3>Internet and Multimedia</h3>
            <ul>
              <li>Internet Explorer 5.5 with 128-bit encryption</li>
              <li>Outlook Express 5.5</li>
              <li>Windows Media Player 7.0</li>
              <li>DirectX 7.0a</li>
              <li>RealPlayer 8 Basic</li>
              <li>QuickTime 4.1.2</li>
            </ul>
            
            <h3>Productivity Software</h3>
            <ul>
              <li>Microsoft Office 2000 Professional</li>
              <li>Adobe Photoshop 5.5</li>
              <li>Macromedia Flash 4</li>
              <li>WinZip 8.0</li>
              <li>Adobe Acrobat Reader 4.0</li>
            </ul>
            
            <h3>System Performance</h3>
            <p>Boot time: 45 seconds</p>
            <p>Available memory: 89 MB</p>
            <p>Free disk space: 8.2 GB</p>
            <p>System resources: 78% free</p>
            
            <p>This system represents a typical high-end home computer configuration from the late 1990s, capable of running the latest software and games of the era.</p>
          </Windows98ScrollContainer>
        </div>
      </div>
    </div>
  );
};

export default ScrollDemo;