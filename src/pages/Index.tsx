import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Añadida la importación que faltaba
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { getFeaturedListings, Listing } from "@/data/mockListings";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { 
  ArrowRight, Calendar, BarChart3, CreditCard, 
  Users, CheckCircle2, Loader2, MapPin, AlertCircle, CheckCircle
} from "lucide-react";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client"; // Updated correct path to supabase client

// Import images with optimization references
import backgroundImage from "@/assets/background.jpeg";
import softwareImage from "@/assets/sofware.png";

// Environment detection
const IS_DEV = import.meta.env.DEV === true || window.location.hostname === 'localhost';

// Get environment variables with fallbacks
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '';

// SEO keywords for the page
const SEO_KEYWORDS = "rv parks for sale, campground reservation software, rv park investment, campground management software, buy rv park, sell rv park";

const Index = () => {
  // Estados para los listings y UI
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Estados para el formulario de suscripción
  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const captchaRef = useRef<HCaptcha | null>(null);
  const { toast } = useToast();
  
  // Cargar listings aprobados cuando el componente se monta
  useEffect(() => {
    const loadApprovedListings = async () => {
      setIsLoading(true);
      try {
        // Esta función ya está filtrando por status 'approved' en la API
        const approvedFeaturedListings = await getFeaturedListings();
        // Only take the last 3 listings
        setFeaturedListings(approvedFeaturedListings.slice(0, 3));
      } catch (error) {
        // No mostramos detalles del error que podrían contener información sensible
        console.error("Error loading listings");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadApprovedListings();
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Resetear errores cuando cambia el email
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [email, captchaToken]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Handle hCaptcha verification
  const handleVerificationSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setFormError("Captcha verification failed. Please try again.");
  };
  
  // Validar email
  const isValidEmail = (email: string): boolean => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  };

  // Submit subscription
  const handleSubscribe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Reset states
    setFormError(null);
    
    // Validate email
    if (!email || !isValidEmail(email)) {
      setFormError("Please enter a valid email address");
      return;
    }
    
    // Validate captcha
    if (!captchaToken) {
      setFormError("Please complete the security verification");
      return;
    }
    
    setIsSubmittingEmail(true);
    
    try {
      // Check if email already exists
      const { data: existingEmails, error: checkError } = await supabase
        .from('email_subscriptions')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw new Error("Error checking subscription status");
      }
      
      if (existingEmails) {
        // Email already exists, update is_active to true if it was false
        const { error: updateError } = await supabase
          .from('email_subscriptions')
          .update({ is_active: true })
          .eq('email', email.toLowerCase());
        
        if (updateError) throw updateError;
        
        toast({
          title: "Already subscribed",
          description: "Your email is already in our subscription list.",
        });
      } else {
        // Insert new subscription
        const { error: insertError } = await supabase
          .from('email_subscriptions')
          .insert([
            { 
              email: email.toLowerCase(), 
              is_active: true,
              created_at: new Date().toISOString()
            }
          ]);
        
        if (insertError) throw insertError;
        
        // Show success
        setSubscriptionSuccess(true);
        toast({
          title: "Subscribed successfully!",
          description: "Thank you for subscribing to our newsletter.",
        });
      }
      
      // Reset form
      setEmail("");
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
      
    } catch (error) {
      console.error("Subscription error:", error);
      setFormError("There was a problem processing your subscription. Please try again.");
      
      // Reset captcha on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      
      toast({
        variant: "destructive",
        title: "Subscription failed",
        description: "There was a problem with your subscription. Please try again.",
      });
    } finally {
      setIsSubmittingEmail(false);
    }
  };
  
  // Array of FAQ items for easier management
  const faqItems = [
    {
      question: "How much does it cost to list my property?",
      answer: "Listing your RV park on RoverPass is completely free. We don't charge any upfront fees or commissions."
    },
    {
      question: "Who can see my listing?",
      answer: "Your listing will be visible to thousands of qualified investors and buyers specifically looking for RV park opportunities."
    },
    {
      question: "How long will my listing be active?",
      answer: "Listings remain active for 6 months and can be renewed or updated at any time through your broker dashboard."
    },
    {
      question: "Can I edit my listing after publishing?",
      answer: "Yes, you can update your listings at any time through your broker dashboard. Changes will be published immediately."
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Add SEO metadata */}
      <Helmet>
        <title>RoverPass - Find RV Parks For Sale & Campground Management Software</title>
        <meta name="description" content="Find the perfect RV park investment or manage your campground with RoverPass. Browse exclusive listings and explore our industry-leading reservation software." />
        <meta name="keywords" content={SEO_KEYWORDS} />
        <meta property="og:title" content="RoverPass - RV Parks For Sale & Campground Management" />
        <meta property="og:description" content="Find RV parks for sale and manage your campground with our reservation software. Connect with qualified buyers or enhance your campground operations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://roverpass.com" />
        <meta property="og:image" content="/og-image.jpg" />
        <link rel="canonical" href="https://roverpass.com" />
      </Helmet>
      
      <Header />
      
      {/* Hero Section - Enhanced with animation */}
      <section className="relative bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src={backgroundImage} 
            alt="RV Park and Campground Background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Moving background pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-overlay blur-xl animate-float-slow"></div>
          <div className="absolute top-20 right-20 w-60 h-60 bg-white rounded-full mix-blend-overlay blur-xl animate-float"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-md">
              Find Your Perfect RV Park Investment
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Browse exclusive listings of RV parks and campgrounds for sale across the United States.
            </p>
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
                <Link to="/listings" className="flex items-center gap-2">
                  Browse All Listings
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
                <Link to="/listings/new">List Your Property</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Removed the non-functional scroll indicator arrow */}
      </section>
      
      {/* Featured Listings Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold relative">
              Latest Properties
              <span className="absolute -bottom-2 left-0 h-1 w-20 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <Button asChild variant="outline" className="border-[#f74f4f] text-[#f74f4f] hover:bg-[#f74f4f]/5 group">
              <Link to="/listings" className="flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-[#f74f4f] animate-spin mb-4" />
                <p className="text-gray-500 text-lg">Loading latest properties...</p>
              </div>
            </div>
          ) : featuredListings.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {featuredListings.map((listing) => (
                <motion.div key={listing.id} variants={itemVariants}>
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-gray-100 rounded-lg">
              <div className="flex flex-col items-center">
                <div className="bg-gray-200 rounded-full p-4 mb-4">
                  <MapPin className="h-10 w-10 text-[#f74f4f]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Featured Properties Available</h3>
                <p className="text-gray-500 max-w-lg mx-auto">
                  We don't have any featured properties at the moment. Please check back soon or browse our other listings.
                </p>
                <Button asChild className="mt-6 bg-[#f74f4f] hover:bg-[#e43c3c]">
                  <Link to="/listings">Browse All Listings</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RV Park Reservation Software Section - UPDATED */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative inline-block">
              The Ultimate Campground Reservation Software
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Take full control of your campground with our industry-leading campground reservation software. 
              Boost revenue, cut operating costs, and deliver an exceptional, seamless experience for both you and your guests.
            </p>
          </motion.div>

          {/* Split section with image and features - UPDATED */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <h3 className="text-2xl font-bold mb-6 text-[#f74f4f]">
                What's included in RoverPass Campground Management Software?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-[#f74f4f]/10 mt-1">
                    <BarChart3 className="h-5 w-5 text-[#f74f4f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Revenue Capabilities</h4>
                    <p className="text-muted-foreground">Manage pricing, discounts, and promotions, all accessible with just a click.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-[#f74f4f]/10 mt-1">
                    <Calendar className="h-5 w-5 text-[#f74f4f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Long-Term Stays</h4>
                    <p className="text-muted-foreground">Manage extended stays with features like Autopay and Flexible Check-outs.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-[#f74f4f]/10 mt-1">
                    <Users className="h-5 w-5 text-[#f74f4f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Guest Management</h4>
                    <p className="text-muted-foreground">Manage bookings and keep in touch with guests among different channels.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-[#f74f4f]/10 mt-1">
                    <CreditCard className="h-5 w-5 text-[#f74f4f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Channel Management</h4>
                    <p className="text-muted-foreground">Connect to leading OTAs like Booking, Hipcamp, Airbnb, and Expedia.</p>
                  </div>
                </div>
              </div>
              
              <Button asChild size="lg" className="mt-8 bg-[#f74f4f] hover:bg-[#e43c3c]">
                <a href="https://www.roverpass.com/p/campground-reservation-software" target="_blank" rel="noopener" className="flex items-center gap-2">
                  Learn More
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2 bg-gray-100 rounded-xl p-3 shadow-lg"
            >
              <img 
                src={softwareImage} 
                alt="RoverPass Campground Reservation Software Dashboard" 
                className="w-full h-auto rounded-lg" 
                loading="lazy"
              />
            </motion.div>
          </div>
          
          {/* Key benefits - UPDATED */}
          <motion.div
            className="bg-gray-50 rounded-2xl p-8 md:p-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-8 text-center">
              Why RV Park Owners Choose Our Software
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Integrations</h4>
                <p className="text-muted-foreground">More than 7,000 integrations through Zapier</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Secure Payments</h4>
                <p className="text-muted-foreground">Process payments securely with integrated payment solutions</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Reports</h4>
                <p className="text-muted-foreground">Make quick and informed decisions with our easy-to-read reports</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Easy Booking</h4>
                <p className="text-muted-foreground">Simplify the reservation process for you and your guests</p>
              </motion.div>
            </div>
            
            <div className="mt-10 text-center">
              <a 
                href="https://www.roverpass.com/p/campground-reservation-software" 
                target="_blank" 
                rel="noopener"
                className="text-[#f74f4f] font-semibold hover:underline inline-flex items-center"
              >
                Learn more about our reservation software
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Removed the testimonials section for software as requested */}
      
      {/* RoverPass Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 relative inline-block">
              Why List With RoverPass?
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Join hundreds of brokers who trust RoverPass to connect with qualified RV park buyers.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Maximum Exposure</h3>
              <p className="text-muted-foreground">
                Your listings are seen by thousands of qualified investors actively looking for RV park opportunities.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Free Listings</h3>
              <p className="text-muted-foreground">
                No upfront fees or commissions. List your properties completely free of charge.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Powerful Tools</h3>
              <p className="text-muted-foreground">
                Backed by RoverPass's deep understanding of the RV park industry and reservation management.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* CTA Section - Modified to highlight both services */}
      <section className="py-16 bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] relative overflow-hidden">
        {/* Moving background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        
        <motion.div 
          className="container mx-auto px-4 text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">RV Park Solutions for Every Need</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Whether you're buying, selling, or managing an RV park, RoverPass has industry-leading tools to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
              <Link to="/listings/new" className="flex items-center gap-2">
                Sell Your RV Park
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
              <a href="https://www.roverpass.com/p/campground-reservation-software" target="_blank" rel="noopener" className="flex items-center gap-2">
                Get Reservation Software
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </motion.div>
      </section>
      
      {/* FAQ Section - Enhanced with interactive accordion */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center relative inline-block">
              Frequently Asked Questions
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
          </motion.div>
          
          <motion.div 
            className="max-w-3xl mx-auto space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {faqItems.map((faq, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  aria-expanded={expandedFaq === index}
                  aria-controls={`faq-content-${index}`}
                  className={`w-full flex justify-between items-center p-6 text-left transition-colors ${
                    expandedFaq === index ? 'bg-[#f74f4f]/5' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleFaq(index)}
                >
                  <h3 className={`text-xl font-semibold ${expandedFaq === index ? 'text-[#f74f4f]' : ''}`}>
                    {faq.question}
                  </h3>
                  <svg
                    className={`h-5 w-5 transition-transform ${
                      expandedFaq === index ? "transform rotate-180 text-[#f74f4f]" : "text-gray-500"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  id={`faq-content-${index}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFaq === index ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <p className="p-6 text-muted-foreground">{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Call to action within FAQ */}
          <motion.div 
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="text-lg mb-4">Still have questions?</p>
            <Button asChild variant="outline" className="border-[#f74f4f] text-[#f74f4f] hover:bg-[#f74f4f]/5">
              <Link to="/support">Contact Our Support Team</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - New section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 relative inline-block">
              What Our Clients Say
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
              Discover what brokers and property owners are saying about their experience with RoverPass.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">JD</span>
                </div>
                <div>
                  <h3 className="font-semibold">John Davis</h3>
                  <p className="text-sm text-gray-500">RV Park Owner</p>
                </div>
              </div>
              <p className="italic text-gray-600">"I sold my RV park in just 3 months thanks to RoverPass. The platform connected me with serious buyers and the process was seamless."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">SM</span>
                </div>
                <div>
                  <h3 className="font-semibold">Sarah Miller</h3>
                  <p className="text-sm text-gray-500">Property Broker</p>
                </div>
              </div>
              <p className="italic text-gray-600">"The analytics dashboard helps me understand which listings are performing best. My clients are consistently impressed with the quality of leads."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">RJ</span>
                </div>
                <div>
                  <h3 className="font-semibold">Robert Johnson</h3>
                  <p className="text-sm text-gray-500">Investor</p>
                </div>
              </div>
              <p className="italic text-gray-600">"I've acquired three properties through RoverPass. The detailed listings and financial information made my investment decisions much easier."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Newsletter Section with HCaptcha */}
      <section className="py-16 bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] relative overflow-hidden">
        {/* Moving background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto text-center text-white relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl mb-8 text-white/80">
              Get the latest RV park listings and industry insights delivered to your inbox.
            </p>
            
            {subscriptionSuccess ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-lg mx-auto">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-16 w-16 text-white mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
                  <p className="mb-6">
                    Your subscription has been confirmed. You'll now receive the latest updates on RV park listings and industry insights.
                  </p>
                  <Button 
                    onClick={() => setSubscriptionSuccess(false)}
                    className="bg-white text-[#f74f4f] hover:bg-gray-100"
                  >
                    Return to Form
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="max-w-lg mx-auto">
                {formError && (
                  <div className="mb-4 p-3 bg-white/10 backdrop-blur-sm rounded-md text-left flex items-start">
                    <AlertCircle className="h-5 w-5 text-white mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-white text-sm">{formError}</span>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50
                      ${!email && formError ? "border-red-300" : ""}`}
                    aria-label="Email address for newsletter"
                    disabled={isSubmittingEmail}
                  />
                  <Button 
                    type="submit"
                    className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all"
                    disabled={isSubmittingEmail || !captchaToken}
                  >
                    {isSubmittingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : "Subscribe"}
                  </Button>
                </div>
                
                {/* Security verification section */}
                <div className={`flex justify-center py-2 mb-4 ${!captchaToken && formError ? "bg-white/10 backdrop-blur-sm rounded-md p-2" : ""}`}>
                  {HCAPTCHA_SITE_KEY ? (
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={HCAPTCHA_SITE_KEY}
                      onVerify={handleVerificationSuccess}
                      onError={handleCaptchaError}
                      onExpire={() => setCaptchaToken(null)}
                      theme="light"
                    />
                  ) : (
                    <div className="text-sm text-white p-2 bg-white/10 backdrop-blur-sm rounded-md">
                      Security verification not configured. Please contact support.
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-white/70 mt-4">
                  By subscribing, you agree to receive marketing emails from RoverPass. 
                  You can unsubscribe at any time.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;