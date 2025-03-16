import { useState } from 'react';
import styles from './FarmerEducation.module.css';

const FarmerEducationalPlatform = () => {
  const [activeTab, setActiveTab] = useState('farmers');
  
  const resources = {
    farmers: [
      { title: 'How to Open a Palengke Stall', url: 'https://youtu.be/KJzmM9SL0mA?si=4m-LQwORG5O8y1C_', type: 'video' },
      { title: 'Low-Cost Business Ideas', url: 'https://starmarket.ph/2020/08/11/low-cost-business-ideas-how-to-open-a-palengke-stall/', type: 'article' },
      { title: 'Farmer Success Stories', url: 'https://youtu.be/ShoD-FOlMUY?si=GfKXt5t19L7TMMhH', type: 'video' },
      { title: 'Farming Techniques', url: 'https://youtu.be/heTxEsrPVdQ', type: 'video' },
      { title: 'Sustainable Farming', url: 'https://youtu.be/KzII2NcyoRc?si=4nbliKh6h', type: 'video' },
      { title: 'Organic Farming', url: 'https://youtu.be/VUUUHzkua68?si=B9VEvsaNWvaTc6cD', type: 'video' }
    ],
    investors: [
      { title: 'Investment Strategies', url: 'https://youtu.be/ss816P3SvfU?si=IdRQ-7C_o0nmH6KI', type: 'video' },
      { title: 'Successful Investments', url: 'https://youtu.be/QP5At9tdGbs?si=Nf4yhDWdVGhvXUvk', type: 'video' },
      { title: 'Investor Insights', url: 'https://www.youtube.com/watch?v=QP5At9tdGbs', type: 'video' },
      { title: 'Market Analysis', url: 'https://youtu.be/KuXKLOInQaM?si=nKV5n1MuBPTiBvdL', type: 'video' },
      { title: 'Investment Opportunities', url: 'https://youtu.be/CJyHXL_-U8c?si=UDBqTQ_QyssrX8a5', type: 'video' },
      { title: 'Financial Planning', url: 'https://www.youtube.com/watch?v=Qp3-y7HfdOk', type: 'video' }
    ],
    buyers: [
      { title: 'Benefits of Buying Local', url: 'https://youtu.be/L7EGhI5qeKI?si=IOmDGmnihZ16EL-G', type: 'video' },
      { title: 'How to Support Farmers', url: 'https://youtu.be/F8M3gdMNJJQ?si=n6qq_sEztSKkDSNB', type: 'video' },
      { title: 'Fresh Produce Buying Guide', url: 'https://www.rappler.com/philippines/list-buy-fresh-produce-help-farmers-philippines/', type: 'article' },
      { title: 'Shopping Tips', url: 'https://yoorekka.com/magazine/metro-manila/2018/02/23/5-clever-tips-for-shopping-at-philippine-wet-markets/', type: 'article' },
      { title: 'Market Visits', url: 'https://youtu.be/gYQMbAfj_Es?si=ECbX30P5JUqzB1K2', type: 'video' },
      { title: 'Supporting Local Farmers', url: 'https://www.youtube.com/watch?v=V8Mx0-eNLCQ', type: 'video' }
    ]
  };

  const descriptions = {
    farmers: 'Learn more about the challenges and opportunities for farmers.',
    investors: 'Discover investment opportunities and success stories.',
    buyers: 'Find out how you can support local farmers by buying directly from them.'
  };

  // Group resources by type for better organization
  const groupResourcesByType = (resourceList) => {
    const videos = resourceList.filter(r => r.type === 'video');
    const articles = resourceList.filter(r => r.type === 'article');
    return { videos, articles };
  };

  const currentResources = groupResourcesByType(resources[activeTab]);

  return (
    <main className={styles.educationContainer}>
      <h1 className={`${styles.sectionTitle} text-3xl mb-8`}>Agricultural Education Resources</h1>
      
      {/* Navigation Tabs */}
      <nav className="mb-8">
        <ul className="flex justify-center gap-4 flex-wrap">
          {Object.keys(resources).map((category) => (
            <li key={category}>
              <button
                onClick={() => setActiveTab(category)}
                className={`px-6 py-3 rounded-full font-medium text-lg capitalize transition-all ${
                  activeTab === category 
                    ? 'bg-[#8bc34a] text-white shadow-lg' 
                    : 'bg-white text-[#8bc34a] hover:bg-[#e0e0e0]'
                }`}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Top sections with the resource categories */}
      <div className={styles.topSections}>
        {/* Videos Section */}
        <section 
          className={styles.section}
          aria-labelledby={`${activeTab}-videos-heading`}
        >
          <h2 
            id={`${activeTab}-videos-heading`} 
            className={`${styles.sectionTitle} capitalize text-2xl`}
          >
            Videos for {activeTab}
          </h2>
          <p className={styles.sectionText}>{descriptions[activeTab]}</p>
          
          <div className={styles.linkBoxes}>
            {currentResources.videos.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                <span className="flex items-center gap-3 justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                  </svg>
                  <span>{resource.title}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Articles Section - Only show if there are articles */}
        {currentResources.articles.length > 0 && (
          <section 
            className={styles.section}
            aria-labelledby={`${activeTab}-articles-heading`}
          >
            <h2 
              id={`${activeTab}-articles-heading`} 
              className={`${styles.sectionTitle} capitalize text-2xl`}
            >
              Articles for {activeTab}
            </h2>
            <p className={styles.sectionText}>Read and learn about the latest agricultural insights</p>
            
            <div className={styles.linkBoxes}>
              {currentResources.articles.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <span className="flex items-center gap-3 justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                      <path d="M8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                    </svg>
                    <span>{resource.title}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
      
      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        <section className={styles.section}>
          <h3 className={`${styles.sectionTitle} text-xl`}>Why Education Matters</h3>
          <p className={`${styles.sectionText} text-gray-700`}>
            Continuous learning and resource sharing are essential for sustainable agricultural development.
            These resources aim to connect farmers, investors, and buyers in a knowledge ecosystem.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Have suggestions for additional resources? Contact us to contribute.
          </p>
        </section>
      </div>
    </main>
  );
};

export default FarmerEducationalPlatform;