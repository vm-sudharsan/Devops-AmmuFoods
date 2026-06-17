import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        { name: 'Home', path: '/' },
        { name: 'About Us', path: '/#about' },
        { name: 'Contact', path: '/#contact' },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-brand-beige/95 backdrop-blur-sm shadow-md border-b border-brand-yellow/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                        <img src={logo} alt="Ammu Foods Logo" className="h-12 w-auto" />
                        <span className="font-serif text-3xl font-bold text-brand-red tracking-tight">
                            Ammu <span className="text-brand-yellow">Foods</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-8 items-center">
                        {links.map((link) => (
                            <a
                                key={link.name}
                                href={link.path}
                                className="text-gray-800 hover:text-brand-red font-medium transition-colors duration-200 text-base"
                            >
                                {link.name}
                            </a>
                        ))}
                        <Link
                            to="/order"
                            className="bg-brand-red text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition-all shadow hover:shadow-md"
                        >
                            Order for Event
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-brand-brown hover:text-brand-red focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-brand-beige border-t border-gray-100 absolute w-full shadow-lg">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {links.map((link) => (
                            <a
                                key={link.name}
                                href={link.path}
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-3 rounded-md text-base font-medium text-gray-800 hover:bg-gray-50 hover:text-brand-red"
                            >
                                {link.name}
                            </a>
                        ))}
                        <Link
                            to="/order"
                            onClick={() => setIsOpen(false)}
                            className="block w-full text-center bg-brand-red text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-all mt-2"
                        >
                            Order for Event
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
