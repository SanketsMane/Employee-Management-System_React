import React from 'react';
import { motion } from 'framer-motion';

const CompanyLogosCarousel = () => {
  const companies = [
    {
      name: 'TCS',
      logo: '/images/companies/tcs.svg',
      fallback: 'TCS'
    },
    {
      name: 'Google',
      logo: '/images/companies/google.svg',
      fallback: 'GOOGLE'
    },
    {
      name: 'Microsoft',
      logo: '/images/companies/microsoft.svg',
      fallback: 'MICROSOFT'
    },
    {
      name: 'EY',
      logo: '/images/companies/ey.svg',
      fallback: 'EY'
    },
    {
      name: 'Deloitte',
      logo: '/images/companies/deloitte.svg',
      fallback: 'DELOITTE'
    },
    {
      name: 'Accenture',
      logo: '/images/companies/accenture.svg',
      fallback: 'ACCENTURE'
    }
  ];

  // Duplicate the array for seamless infinite scroll
  const duplicatedCompanies = [...companies, ...companies, ...companies];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      viewport={{ once: true }}
      className="mt-12 text-center"
    >
            <div className="text-center mb-12">
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join thousands of organizations worldwide who trust our platform for their employee management needs.
        </p>
      </div>
      
      <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800/30 rounded-xl py-6">
        {/* Gradient overlays for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 dark:from-gray-800/30 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 dark:from-gray-800/30 to-transparent z-10"></div>
        
        {/* Scrolling container */}
        <motion.div
          className="flex space-x-8"
          animate={{
            x: [0, -100 * companies.length * 2] // Move by twice the original length
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {duplicatedCompanies.map((company, index) => (
            <motion.div
              key={`${company.name}-${index}`}
              className="flex-shrink-0 flex items-center justify-center h-12 w-28"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white/80 dark:bg-gray-700/50 px-3 py-2 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center h-10 w-24 backdrop-blur-sm">
                <img 
                  src={company.logo} 
                  alt={`${company.name} logo`}
                  className="max-h-6 max-w-20 object-contain filter dark:brightness-95 opacity-75 hover:opacity-100 transition-opacity duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <span 
                  className="font-medium text-gray-500 dark:text-gray-400 text-xs hidden"
                  style={{display: 'none'}}
                >
                  {company.fallback}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CompanyLogosCarousel;