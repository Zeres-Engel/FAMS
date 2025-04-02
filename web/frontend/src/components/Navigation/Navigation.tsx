import React from 'react';
import './Navigation.scss';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate }) => {
  return (
    <nav className="main-navigation">
      <ul>
        <li className={currentPath === '/' ? 'active' : ''}>
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault(); 
              onNavigate('/');
            }}
          >
            🏠 Trang chủ
          </a>
        </li>
        <li className={currentPath === '/schedule' ? 'active' : ''}>
          <a 
            href="/schedule" 
            onClick={(e) => {
              e.preventDefault(); 
              onNavigate('/schedule');
            }}
          >
            📅 Thời khóa biểu
          </a>
        </li>
        <li className={currentPath === '/profile' ? 'active' : ''}>
          <a 
            href="/profile" 
            onClick={(e) => {
              e.preventDefault(); 
              onNavigate('/profile');
            }}
          >
            👤 Hồ sơ cá nhân
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation; 