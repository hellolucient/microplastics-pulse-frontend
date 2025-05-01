import React from 'react';
import ArticleSection from './ArticleSection';
import ResearchTimeline from './ResearchTimeline';
import { Clock, AlertTriangle, BookOpen, BarChart2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const MainContent: React.FC = () => {
  const lastUpdated = formatDate(new Date());
  
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="relative">
            <img 
              src="https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="Plastic pollution in ocean" 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-6">
                <h1 className="text-white text-3xl md:text-4xl font-bold">Microplastics: A Growing Threat to Human Health</h1>
                <p className="text-white/80 mt-2 max-w-3xl">
                  A comprehensive review of research on microplastic contamination and its implications for human health
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6 space-x-4 border-b border-gray-100 pb-4">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>Last updated: {lastUpdated}</span>
              </div>
              <div className="flex items-center">
                <BookOpen size={16} className="mr-1" />
                <span>20 min read</span>
              </div>
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                <span>126 sources cited</span>
              </div>
            </div>
            
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Research Update Notice</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      This is a living document that is regularly updated as new research emerges. The content reflects 
                      the current scientific understanding of microplastics and their health effects, but this field is rapidly evolving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <ArticleSection 
              id="introduction"
              title="Introduction to Microplastics"
              content={`
                <p>Microplastics are small plastic particles less than 5mm in diameter that are increasingly found throughout our environment. They come from a variety of sources, including the breakdown of larger plastic items, microbeads in personal care products, and synthetic fibers from clothing.</p>
                
                <p>As plastic production has increased exponentially since the 1950s, so too has the amount of plastic waste in our environment. This waste breaks down into smaller and smaller particles, eventually forming microplastics and even nanoplastics (particles smaller than 1μm).</p>
                
                <p>Research into the health effects of microplastics is still emerging, but evidence suggests that these particles can enter the human body through ingestion, inhalation, and even skin contact. Once inside the body, they may cause a range of health problems, from inflammation and oxidative stress to disruption of the gut microbiome and endocrine system.</p>
              `}
            />
            
            <ArticleSection 
              id="health-impacts"
              title="Health Impacts"
              content={`
                <p>The potential health impacts of microplastics are a growing concern among researchers and health professionals. As these tiny particles infiltrate our food, water, and air, they find their way into the human body where they may cause a variety of adverse effects.</p>
              `}
              isUpdated={true}
              updateDate="2025-05-14"
            />
            
            <ArticleSection 
              id="digestive-system"
              title="Digestive System"
              content={`
                <p class="mb-4">Microplastics enter our digestive system primarily through the consumption of contaminated food and water. Studies have found microplastics in a wide range of food products, including seafood, salt, and even bottled water.</p>
                
                <p class="mb-4">Once in the digestive system, microplastics can:</p>
                
                <ul class="list-disc pl-5 mb-4 space-y-2">
                  <li>Disrupt the gut microbiome, potentially leading to dysbiosis and associated health problems</li>
                  <li>Cause inflammation in the gut lining, which may contribute to conditions like inflammatory bowel disease</li>
                  <li>Potentially translocate across the gut barrier into the bloodstream and lymphatic system</li>
                  <li>Serve as carriers for other toxins and pathogens, bringing them into the digestive system</li>
                </ul>
                
                <p class="mb-4">A 2023 study published in the Journal of Hazardous Materials found that exposure to microplastics altered the composition of gut bacteria in animal models, leading to increased inflammation and impaired gut barrier function.</p>
                
                <div class="bg-blue-50 p-4 rounded-md border-l-4 border-blue-400 mb-4">
                  <h4 class="text-blue-800 font-medium mb-2">New Research (April 2025)</h4>
                  <p class="text-blue-700">Recent research from Stanford University has demonstrated that certain types of microplastics can bind to digestive enzymes, potentially reducing their efficiency and impacting nutrient absorption. This may have implications for overall nutritional status, particularly in vulnerable populations.</p>
                </div>
              `}
              isNew={true}
            />
            
            <ArticleSection 
              id="prevention"
              title="Prevention & Avoidance"
              content={`
                <p class="mb-4">While it's impossible to completely avoid microplastics in today's world, there are steps individuals can take to reduce their exposure:</p>
                
                <h4 class="font-medium text-lg mb-2">Drinking Water</h4>
                <ul class="list-disc pl-5 mb-4 space-y-2">
                  <li>Use high-quality water filters certified to remove microplastics (look for filters that can remove particles as small as 1 micron)</li>
                  <li>Avoid bottled water when possible, as plastic bottles can be a source of microplastics</li>
                  <li>If using bottled water, choose glass containers over plastic</li>
                </ul>
                
                <h4 class="font-medium text-lg mb-2">Food Sources</h4>
                <ul class="list-disc pl-5 mb-4 space-y-2">
                  <li>Reduce consumption of foods with high microplastic contamination, such as some seafood</li>
                  <li>Avoid heating or storing food in plastic containers, especially fatty or acidic foods</li>
                  <li>Use glass, stainless steel, or ceramic containers for food storage</li>
                  <li>Wash fruits and vegetables thoroughly to remove surface contaminants</li>
                </ul>
                
                <h4 class="font-medium text-lg mb-2">Air Quality</h4>
                <ul class="list-disc pl-5 mb-4 space-y-2">
                  <li>Use air purifiers with HEPA filters in your home</li>
                  <li>Vacuum regularly with a vacuum cleaner equipped with a HEPA filter</li>
                  <li>Minimize synthetic textiles in your home, as they can shed microfibers</li>
                </ul>
                
                <h4 class="font-medium text-lg mb-2">Personal Care Products</h4>
                <ul class="list-disc pl-5 mb-4 space-y-2">
                  <li>Check product labels and avoid those containing "polyethylene" or "polypropylene"</li>
                  <li>Choose natural fiber clothing over synthetic when possible</li>
                  <li>Use a washing machine filter to catch microfibers during laundry</li>
                </ul>
              `}
            />
            
            <div id="research" className="my-12">
              <h2 className="text-2xl font-bold mb-6">Latest Research Timeline</h2>
              <p className="text-gray-700 mb-6">
                This timeline represents key research publications and findings related to microplastics and human health. 
                It is continuously updated as new research emerges.
              </p>
              <ResearchTimeline />
            </div>
            
            <ArticleSection 
              id="about"
              title="About This Living Whitepaper"
              content={`
                <p class="mb-4">This document is designed to be a comprehensive, continuously updated resource on microplastics and their impact on human health. Unlike traditional whitepapers that become outdated as soon as they are published, this living document evolves with the science.</p>
                
                <h4 class="font-medium text-lg mb-2">Our Approach</h4>
                <p class="mb-4">We monitor scientific journals, research institutions, and reputable news sources for new information about microplastics. When significant new research emerges, we update the relevant sections of this document, clearly marking new and updated content.</p>
                
                <h4 class="font-medium text-lg mb-2">Content Updates</h4>
                <p class="mb-4">Updates to this document may include:</p>
                <ul class="list-disc pl-5 mb-4 space-y-2">
                  <li>Addition of new research findings</li>
                  <li>Revision of existing content based on new evidence</li>
                  <li>New sections covering emerging areas of concern</li>
                  <li>Updated recommendations for reducing exposure</li>
                </ul>
                
                <h4 class="font-medium text-lg mb-2">Contributors</h4>
                <p class="mb-4">This document is maintained by a team of researchers, environmental scientists, and health professionals committed to providing accurate, up-to-date information about microplastics and their health effects.</p>
                
                <h4 class="font-medium text-lg mb-2">Feedback</h4>
                <p class="mb-4">We welcome feedback on this document. If you have suggestions for improvement or notice any inaccuracies, please contact us using the feedback form.</p>
              `}
            />

          </div>
        </div>
      </div>
    </main>
  );
};

export default MainContent;