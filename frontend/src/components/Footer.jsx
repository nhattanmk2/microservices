import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        <p className="font-medium text-gray-700">Hệ thống Microservices Thương Mại Điện Tử (Spring Boot & Spring Cloud)</p>
        <p className="mt-1 text-xs text-gray-400">
          Kết nối qua Zuul API Gateway :8080 • Eureka Discovery :8761 • Redis Cache & MySQL
        </p>
      </div>
    </footer>
  );
};

export default Footer;

