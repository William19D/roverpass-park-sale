import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-3 bg-[#17232c] text-white">
      <div className="container mx-auto footer">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 py-4">
          <div>
            <a href="https://www.roverpass.com/">
              <img
                alt="RoverPass"
                title="RoverPass"
                height="36"
                className="mb-3"
                src="https://d21q6se01pvc3d.cloudfront.net/assets/logos/roverpass-logo-salmon-7131110d6be5bb7723a85b74de54ab9cbf7751df296d28d782340a42e394ad8b.svg"
              />
            </a>
            <ul className="list-none p-0 m-0 space-y-1">
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/p/terms">Terms</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/p/terms/privacy">Privacy Policy</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/sitemap/">Sitemap</a></li>
            </ul>
            <hr className="border-white mt-2 opacity-50" />
            <div className="mb-3 mt-2">
              <a className="text-white pr-3 hover:text-gray-300" target="_blank" rel="noopener noreferrer" title="Facebook" href="https://www.facebook.com/RoverPass">
                <i className="fa-brands fa-facebook-f fa-2x" aria-hidden="true"></i>
              </a>
              <a className="text-white pr-3 hover:text-gray-300" target="_blank" rel="noopener noreferrer" title="Twitter" href="https://twitter.com/Rover_Pass">
                <i className="fa-brands fa-twitter fa-2x" aria-hidden="true"></i>
              </a>
              <a className="text-white hover:text-gray-300" target="_blank" rel="noopener noreferrer" title="Instagram" href="https://www.instagram.com/roverpass/">
                <i className="fa-brands fa-instagram fa-2x" aria-hidden="true"></i>
              </a>
            </div>
            <br />
          </div>

          <div>
            <strong className="text-lg">Travelers</strong>
            <ul className="list-none p-0 m-0 space-y-1">
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/camper-signup/">Create Account</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/camper-signin/">Sign In</a></li>
              <li><a className="text-white hover:text-gray-300" target="_blank" rel="noopener noreferrer" href="https://outdoorsyinc.go2cloud.org/aff_c?offer_id=28&aff_id=1258&aff_sub=banner">Roamly RV Insurance</a></li>
              <li><a className="text-white hover:text-gray-300" target="_blank" rel="noopener noreferrer" href="https://www.roverpass.com/p/trip-essentials">Trip Essentials</a></li>
            </ul>
            <br />
          </div>

          <div>
            <strong className="text-lg">Affiliate Opportunities</strong>
            <ul className="list-none p-0 m-0 space-y-1">
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/p/ambassadors">Ambassadors</a></li>
            </ul>
            <br />
          </div>

          <div>
            <strong className="text-lg">Campgrounds</strong>
            <ul className="list-none p-0 m-0 space-y-1">
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/owner/">Owner Sign In</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/p/marketplace">Claim Your Campground</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/p/campground-reservation-software">Campground Reservation Software</a></li>
            </ul>
            <br />
          </div>

          <div>
            <strong className="text-lg">Company</strong>
            <ul className="list-none p-0 m-0 space-y-1">
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/about/">About</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/blog/">Blog</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/blog/roverpass-press-releases/">Press</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://help.roverpass.com/">FAQ</a></li>
              <li><a className="text-white hover:text-gray-300" target="_blank" rel="noopener noreferrer" href="https://help.roverpass.com/support">Contact Us</a></li>
              <li><a className="text-white hover:text-gray-300" href="https://www.roverpass.com/p/work-with-us">Advertise With Us</a></li>
            </ul>
            <br />
          </div>
        </div>

        <p className="text-center mb-0">
          © {new Date().getFullYear()} Roverpass
        </p>
      </div>
    </footer>
  );
};