import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-brand-brown text-brand-beige pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <h2 className="text-3xl font-serif font-bold text-white">Ammu <span className="text-brand-yellow">Foods</span></h2>
                        <p className="text-sm opacity-80 leading-relaxed">
                            Authentic homemade Indian sweets and delicacies, made with love and traditional recipes. Bringing the taste of celebration to your doorstep since 2018.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a
                                href="https://www.instagram.com/ammufoods.ac?igsh=MWVjbjh3ZHEyZ3Y0cg=="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-brand-yellow transition-colors"
                                aria-label="Follow us on Instagram"
                            >
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Quick Links</h3>
                        <ul className="space-y-3 text-sm opacity-80">
                            <li><a href="/#about" className="hover:text-brand-yellow transition-colors">About Us</a></li>
                            <li><a href="/#products" className="hover:text-brand-yellow transition-colors">Our Products</a></li>
                            <li><Link to="/order" className="hover:text-brand-yellow transition-colors">Order for Event</Link></li>
                            <li><a href="/#contact" className="hover:text-brand-yellow transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                    {/* Events We Serve */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Events We Serve</h3>
                        <ul className="space-y-3 text-sm opacity-80">
                            <li>💒 Weddings &amp; Receptions</li>
                            <li>🎂 Birthday Parties</li>
                            <li>🏢 Corporate Events</li>
                            <li>🪔 Religious Functions</li>
                            <li>🥂 Get-togethers &amp; Parties</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Contact Us</h3>
                        <ul className="space-y-4 text-sm opacity-80">
                            <li className="flex items-start">
                                <MapPin size={18} className="mr-3 mt-1 flex-shrink-0 text-brand-yellow" />
                                <span>7/602, Kumaran Nagar, Sulthanpet, Sulur, Coimbatore 641669</span>
                            </li>
                            <li className="flex items-center">
                                <Phone size={18} className="mr-3 flex-shrink-0 text-brand-yellow" />
                                <a href="tel:+919994936495" className="hover:text-brand-yellow transition-colors">99949 36495</a>
                            </li>
                            <li className="flex items-center">
                                <Mail size={18} className="mr-3 flex-shrink-0 text-brand-yellow" />
                                <a href="mailto:ammufoods2018@gmail.com" className="hover:text-brand-yellow transition-colors">ammufoods2018@gmail.com</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-brand-beige/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs opacity-60">
                    <p>&copy; {new Date().getFullYear()} Ammu Foods. All rights reserved.</p>
                    <p className="mt-2 md:mt-0">Coimbatore, Tamil Nadu, India</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
