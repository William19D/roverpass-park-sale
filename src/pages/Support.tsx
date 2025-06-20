import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { HelpCircle, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

// Define FAQs for the Support page
const faqs = [
  {
    question: "How do I create a listing?",
    answer: "To create a listing, sign in to your account and click on 'Add Listing' in the navigation menu. Follow the step-by-step form to complete your listing information."
  },
  {
    question: "How long will my listing remain active?",
    answer: "Listings remain active for 6 months by default. You can renew or update your listing at any time through your broker dashboard."
  },
  {
    question: "Can I edit my listing after publishing?",
    answer: "Yes, you can update your listings at any time through your broker dashboard. All changes will be published immediately."
  },
  {
    question: "How do I contact a seller?",
    answer: "On each listing page, you'll find a contact form that allows you to send a message directly to the property seller or broker."
  },
  {
    question: "Why was my listing rejected?",
    answer: "Listings may be rejected if they don't meet our content guidelines or contain incomplete information. You'll receive an email with specific reasons and instructions on how to resubmit."
  },
  {
    question: "How do I manage inquiries about my RV park?",
    answer: "All inquiries about your properties can be found in your dashboard under the 'Inquiries' tab. You can respond directly to potential buyers from there."
  }
];

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formLoaded, setFormLoaded] = useState(false);
  const [formLoadError, setFormLoadError] = useState(false);
  const hubspotContainerRef = useRef<HTMLDivElement>(null);

  // Load HubSpot script and initialize form
  useEffect(() => {
    let scriptTimeout: NodeJS.Timeout;
    let isMounted = true;

    const loadHubspotForm = () => {
      // Load the HubSpot script
      const script = document.createElement('script');
      script.src = "//js.hsforms.net/forms/embed/v2.js";
      script.charset = "utf-8";
      script.type = "text/javascript";
      script.async = true;
        // Set a timeout to detect if the script fails to load
      scriptTimeout = setTimeout(() => {
        if (isMounted && !window.hbspt) {
          setFormLoadError(true);
        }
      }, 10000); // 10 seconds timeout
      
      // Once the script loads, initialize the form
      script.onload = () => {
        clearTimeout(scriptTimeout);
        
        if (isMounted && window.hbspt && hubspotContainerRef.current) {
          try {
            // Prefill data if the user is logged in
            const context = user ? {
              pageContext: {
                email: user.email,
                // Add other available user information here
                ...user.user_metadata
              }
            } : {};
            
            window.hbspt.forms.create({
              portalId: "4867863",
              formId: "35c19985-31ed-4770-87bd-3acbfd1cb24b",
              region: "na1",
              target: "#hubspot-form-container",
              ...context,
              onFormSubmit: () => {
                if (isMounted) {
                  toast({
                    title: "Message Sent Successfully",
                    description: "We'll get back to you as soon as possible",
                  });
                }
              }
            });
            
            setFormLoaded(true);          } catch (error) {
            if (isMounted) {
              setFormLoadError(true);
            }
          }
        }
      };
        // Handle script load error
      script.onerror = () => {
        clearTimeout(scriptTimeout);
        if (isMounted) {
          setFormLoadError(true);
        }
      };
      
      document.body.appendChild(script);
      
      return () => {
        clearTimeout(scriptTimeout);
        isMounted = false;
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    };
    
    loadHubspotForm();
  }, [user, toast]);
  
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>Support - RoverPass</title>
        <meta name="description" content="Get help with RoverPass. Contact our support team for assistance with listings, account issues, or general questions." />
      </Helmet>
      
      <Header />
      
      <div className="container mx-auto py-12 px-4 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Support Center</h1>
              <p className="text-muted-foreground">
                Need help? Get in touch with our support team or browse common questions.
              </p>
            </div>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* HubSpot Form Container */}
                <div 
                  id="hubspot-form-container" 
                  ref={hubspotContainerRef}
                  className="min-h-[400px]"
                >
                  {!formLoaded && !formLoadError && (
                    <div className="text-center py-12">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#f74f4f]" />
                      <p className="mt-4 text-gray-500">Loading support form...</p>
                    </div>
                  )}
                  
                  {formLoadError && (
                    <div className="text-center py-12 bg-red-50 rounded-lg border border-red-100">
                      <AlertCircle className="h-10 w-10 mx-auto text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Form Could Not Be Loaded</h3>
                      <p className="text-gray-600 mb-4 max-w-md mx-auto">
                        We're having trouble loading our support form. Please try refreshing the page or contact us via email.
                      </p>
                      <Button 
                        asChild
                        className="bg-[#f74f4f] hover:bg-[#e43c3c] mt-2"
                      >
                        <a href="mailto:support@roverpass.com">
                          Contact via Email
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* FAQ Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-[#f74f4f]" />
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      className={`w-full flex justify-between items-center p-4 text-left transition-colors ${
                        expandedFaq === index ? 'bg-[#f74f4f]/5' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleFaq(index)}
                      aria-expanded={expandedFaq === index}
                      aria-controls={`faq-answer-${index}`}
                    >
                      <span className={`font-medium ${expandedFaq === index ? 'text-[#f74f4f]' : ''}`}>
                        {faq.question}
                      </span>
                      <ChevronRight
                        className={`h-5 w-5 transition-transform ${
                          expandedFaq === index ? "transform rotate-90 text-[#f74f4f]" : "text-gray-400"
                        }`}
                      />
                    </button>
                    <div
                      id={`faq-answer-${index}`}
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        expandedFaq === index ? "max-h-64" : "max-h-0"
                      }`}
                      aria-hidden={expandedFaq !== index}
                    >
                      <div className="p-4 bg-gray-50 text-muted-foreground">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <Link 
                  to="/listings"
                  className="text-[#f74f4f] font-medium hover:underline inline-flex items-center"
                >
                  Browse all listings
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

// Declare HubSpot types for TypeScript
declare global {
  interface Window {
    hbspt: {
      forms: {
        create: (config: {
          portalId: string;
          formId: string;
          region: string;
          target: string;
          pageContext?: any;
          onFormSubmit?: () => void;
        }) => void;
      };
    };
  }
}

export default Support;