const Footer = () => {
  return (
    <footer className="bg-indigo text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/70 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} dhanavinya.id All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
