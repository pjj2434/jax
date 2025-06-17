// components/Navbar.js
import { Button } from './button';
import Link from 'next/link';

const Navbarsess = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-10 flex justify-between items-center py-4 border-b border-gray-200">
      <div className="ml-4">
        {/* Your logo or brand name here */}
        <h1>Noble Elevator</h1>
      </div>
      <div className="flex items-center space-x-4 mr-4">
        
        <Link href="/ticket">
          <Button variant="default">Dashboard</Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbarsess;
