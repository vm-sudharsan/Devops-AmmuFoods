import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ammuLady from '../assets/ammu_lady.jpg';
import product1 from '../assets/product_1.jpeg';
import product2 from '../assets/product_2.jpeg';
import product3 from '../assets/product_3.jpeg';
import product4 from '../assets/product_4.jpeg';
import { ArrowRight, Phone, Mail, MapPin, Instagram } from 'lucide-react';

const products = [
    {
        id: 1, name: 'Elaneer Payasam', img: product1,
        desc: 'Fresh tender coconut payasam — light, creamy, served chilled. Made the same morning it reaches you.',
    },
    {
        id: 2, name: 'Jigirthanda', img: product2,
        desc: "Madurai's most loved cold drink. Layers of nannari, almond gum, reduced milk and ice cream in every glass.",
    },
    {
        id: 3, name: 'Sweet Beeda', img: product3,
        desc: 'Betel leaf rolls filled with coconut, spices and sugar. A traditional closer to every celebration.',
    },
    {
        id: 4, name: 'Ice Creams', img: product4,
        desc: 'Homemade, no shortcuts. Natural flavours, fresh milk, and the kind of taste that takes you back home.',
    },
];

const qualities = [
    { num: '01', title: 'Made by hand, every time', body: "No machines, no bulk production. Each item is prepared fresh in our home kitchen on the day it's needed." },
    { num: '02', title: 'No preservatives, ever', body: 'Pure ingredients only. What you taste is exactly what went in — nothing added to extend shelf life.' },
    { num: '03', title: 'Delivered fresh to your venue', body: 'We prepare on the day and deliver to your event. You get it at its best, not hours later.' },
    { num: '04', title: 'Trusted across Coimbatore', body: 'Seven years of weddings, parties, and daily shop supply. Our reputation is built one order at a time.' },
];

const steps = [
    { n: '1', t: 'Tell us about your event', d: 'Fill in the order form — event date, venue, guest count, and what you need. Takes 2 minutes.' },
    { n: '2', t: 'We confirm within 24 hours', d: 'Our team reviews your request and calls you to confirm availability, quantities, and delivery details.' },
    { n: '3', t: 'Fresh delivery to your venue', d: 'We prepare everything on the day and deliver it to your venue, ready to serve.' },
];

const eventList = [
    'Weddings & Receptions',
    'Birthday Parties',
    'Corporate Events & Office Gatherings',
    'Religious Functions & Festivals',
    'Anniversaries & Get-togethers',
    'Graduation Celebrations',
];

// ── Floating right sidebar ──
const FloatingSidebar = () => (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl">
        <a
            href="https://wa.me/919994936495"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="group flex items-center bg-[#25D366] text-white px-3 py-4 hover:px-5 transition-all duration-300"
        >
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="ml-2 text-xs font-semibold whitespace-nowrap max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300">
                WhatsApp
            </span>
        </a>
        <a
            href="https://www.instagram.com/ammufoods.ac?igsh=MWVjbjh3ZHEyZ3Y0cg=="
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
            className="group flex items-center text-white px-3 py-4 hover:px-5 transition-all duration-300"
            style={{ background: 'linear-gradient(180deg,#f09433,#e6683c,#dc2743)' }}
        >
            <Instagram className="w-5 h-5 flex-shrink-0" />
            <span className="ml-2 text-xs font-semibold whitespace-nowrap max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300">
                Instagram
            </span>
        </a>
        <a
            href="mailto:ammufoods2018@gmail.com"
            title="Email us"
            className="group flex items-center bg-brand-red text-white px-3 py-4 hover:px-5 transition-all duration-300"
        >
            <Mail className="w-5 h-5 flex-shrink-0" />
            <span className="ml-2 text-xs font-semibold whitespace-nowrap max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300">
                Email Us
            </span>
        </a>
    </div>
);

const Home = () => (
    <div className="min-h-screen flex flex-col" style={{ background: '#FDFAF4' }}>
        <Navbar />
        <FloatingSidebar />

        {/* ── HERO ── */}
        <section style={{ background: '#FFF8EE' }} className="overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">

                {/* Left */}
                <div className="space-y-7">
                    <p className="text-brand-red font-semibold text-sm tracking-widest uppercase">
                        Coimbatore · Since 2018
                    </p>
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-brand-brown leading-[1.1]">
                        Homemade sweets<br />
                        <span className="text-brand-red font-cursive italic font-normal text-6xl md:text-7xl">
                            for your moments
                        </span>
                    </h1>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-md">
                        We make Elaneer Payasam, Jigirthanda, Sweet Beeda and Ice Creams — fresh, by hand, the same way we always have. For weddings, birthdays, and every celebration in between.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <Link
                            to="/order"
                            className="inline-flex items-center gap-2 bg-brand-red text-white px-7 py-3.5 rounded-full font-bold text-base hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
                        >
                            Order for Your Event <ArrowRight size={18} />
                        </Link>
                        <a
                            href="#products"
                            className="inline-flex items-center gap-2 text-brand-brown border-b-2 border-brand-yellow font-semibold text-base hover:text-brand-red transition-colors pb-0.5"
                        >
                            See our menu
                        </a>
                    </div>

                    {/* Trust numbers */}
                    <div className="flex items-center gap-6 pt-4 border-t border-brand-yellow/30">
                        {[
                            { val: '7+', label: 'Years' },
                            { val: '500+', label: 'Happy customers' },
                            { val: '100%', label: 'Homemade' },
                        ].map((s, i, arr) => (
                            <React.Fragment key={s.val}>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-brand-brown">{s.val}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                                </div>
                                {i < arr.length - 1 && <div className="w-px h-8 bg-brand-yellow/40" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Right — founder photo */}
                <div className="relative flex justify-center md:justify-end">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute -top-6 -right-6 w-72 h-72 bg-brand-yellow/20 rounded-full blur-2xl" />
                        <div className="absolute -bottom-4 -left-4 w-48 h-48 bg-brand-red/10 rounded-full blur-2xl" />
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                            <img src={ammuLady} alt="Ammu — Founder" className="w-full h-auto object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 py-4">
                                <p className="text-white font-serif text-lg font-bold">Ammu</p>
                                <p className="text-brand-yellow text-xs">Founder, Ammu Foods</p>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 bg-brand-yellow text-brand-brown font-bold font-serif w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white">
                            <span className="text-[9px] uppercase tracking-wider">Since</span>
                            <span className="text-lg leading-none">2018</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ── STORY ── */}
        <section id="about" className="bg-white py-20">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-16 items-start">
                <div>
                    <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-4">Our Story</p>
                    <h2 className="text-4xl font-serif font-bold text-brand-brown leading-tight mb-6">
                        A home kitchen that<br />grew into something more
                    </h2>
                    <p className="text-gray-600 text-base leading-relaxed mb-4">
                        It started simply — Ammu making sweets for family, neighbours asking for more, and word spreading through Coimbatore the way good food always does. By 2018, what was a home kitchen had become Ammu Foods.
                    </p>
                    <p className="text-gray-600 text-base leading-relaxed mb-4">
                        We still make everything by hand. No factory, no preservatives, no shortcuts. The same Elaneer Payasam that made people stop and ask "where did you get this?" is the same one we'll bring to your wedding, your birthday, your celebration.
                    </p>
                    <p className="text-gray-600 text-base leading-relaxed">
                        Today we supply local shops across Coimbatore and take event orders across the region. But the kitchen — and the care — has not changed.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 pt-2">
                    {qualities.map(q => (
                        <div key={q.num} className="flex gap-5 items-start border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                            <span className="text-brand-yellow font-bold text-lg font-serif flex-shrink-0 mt-0.5">{q.num}</span>
                            <div>
                                <h3 className="font-bold text-brand-brown mb-1">{q.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{q.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* ── PRODUCTS ── */}
        <section id="products" style={{ background: '#FFF8EE' }} className="py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="mb-14">
                    <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-3">What we make</p>
                    <h2 className="text-4xl font-serif font-bold text-brand-brown">Our Signature Items</h2>
                </div>

                {/* Desktop timeline */}
                <div className="hidden md:block relative">
                    <div className="absolute top-[256px] left-0 right-0 h-px bg-brand-yellow/50" />
                    <div className="grid grid-cols-4 gap-8 relative">
                        {products.map((p, i) => (
                            <div key={p.id} className={`flex flex-col ${i % 2 !== 0 ? 'mt-20' : ''}`}>
                                <div className="rounded-2xl overflow-hidden bg-white shadow-md border border-brand-yellow/20 mb-5 h-56 flex items-center justify-center">
                                    <img
                                        src={p.img}
                                        alt={p.name}
                                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="w-4 h-4 rounded-full bg-brand-red border-[3px] border-white shadow mx-auto mb-5 flex-shrink-0" />
                                <h3 className="font-serif font-bold text-brand-brown text-base mb-1.5">{p.name}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile stacked */}
                <div className="md:hidden space-y-8">
                    {products.map(p => (
                        <div key={p.id} className="flex gap-5 items-start">
                            <div className="w-24 h-24 rounded-xl overflow-hidden bg-white shadow flex-shrink-0 flex items-center justify-center border border-brand-yellow/20">
                                <img src={p.img} alt={p.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="pt-1">
                                <h3 className="font-serif font-bold text-brand-brown text-base mb-1">{p.name}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-14">
                    <Link
                        to="/order"
                        className="inline-flex items-center gap-2 bg-brand-red text-white px-7 py-3.5 rounded-full font-bold text-base hover:bg-red-700 transition-all shadow-md"
                    >
                        Order for your event <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </section>

        {/* ── EVENTS + HOW IT WORKS ── */}
        <section className="bg-white py-20">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-16 items-start">
                <div>
                    <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-4">Event Catering</p>
                    <h2 className="text-4xl font-serif font-bold text-brand-brown leading-tight mb-6">
                        We have been part of<br />a lot of celebrations
                    </h2>
                    <p className="text-gray-600 text-base leading-relaxed mb-8">
                        Weddings, birthdays, corporate lunches, religious functions — if there is a gathering, we will make sure the food is something people remember. We handle the sweets so you can focus on everything else.
                    </p>
                    <ul className="space-y-3 mb-8">
                        {eventList.map(ev => (
                            <li key={ev} className="flex items-center gap-3 text-gray-700 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />
                                {ev}
                            </li>
                        ))}
                    </ul>
                    <Link
                        to="/order"
                        className="inline-flex items-center gap-2 text-brand-red font-bold border-b-2 border-brand-red pb-0.5 hover:text-red-700 transition-colors text-sm"
                    >
                        Request an order <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="space-y-8">
                    <p className="text-brand-brown font-bold text-lg font-serif">How it works</p>
                    {steps.map(step => (
                        <div key={step.n} className="flex gap-5 items-start">
                            <div className="w-10 h-10 rounded-full bg-brand-red text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                {step.n}
                            </div>
                            <div>
                                <h4 className="font-bold text-brand-brown mb-1">{step.t}</h4>
                                <p className="text-sm text-gray-500 leading-relaxed">{step.d}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" style={{ background: '#FFF8EE' }} className="py-20">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-16 items-start">
                <div>
                    <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-4">Get in touch</p>
                    <h2 className="text-4xl font-serif font-bold text-brand-brown leading-tight mb-4">
                        We would love to hear<br />about your event
                    </h2>
                    <p className="text-gray-600 text-base leading-relaxed mb-8">
                        Have a question before placing an order? Want to check availability for a date? Just reach out — we are happy to help.
                    </p>
                    <Link
                        to="/order"
                        className="inline-flex items-center gap-2 bg-brand-red text-white px-7 py-3.5 rounded-full font-bold text-base hover:bg-red-700 transition-all shadow-md"
                    >
                        Place an Order <ArrowRight size={18} />
                    </Link>
                </div>

                <div className="space-y-6">
                    <a href="tel:+919994936495" className="flex items-center gap-5 group">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-brand-yellow/30 flex items-center justify-center shadow-sm group-hover:bg-brand-red group-hover:border-brand-red transition-all flex-shrink-0">
                            <Phone size={20} className="text-brand-red group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Call us</p>
                            <p className="font-bold text-brand-brown text-lg group-hover:text-brand-red transition-colors">99949 36495</p>
                        </div>
                    </a>

                    <a href="mailto:ammufoods2018@gmail.com" className="flex items-center gap-5 group">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-brand-yellow/30 flex items-center justify-center shadow-sm group-hover:bg-brand-red group-hover:border-brand-red transition-all flex-shrink-0">
                            <Mail size={20} className="text-brand-red group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Email us</p>
                            <p className="font-bold text-brand-brown group-hover:text-brand-red transition-colors">ammufoods2018@gmail.com</p>
                        </div>
                    </a>

                    <a href="https://wa.me/919994936495" target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 group">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-brand-yellow/30 flex items-center justify-center shadow-sm group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-all flex-shrink-0">
                            <svg className="w-5 h-5 text-[#25D366] group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">WhatsApp</p>
                            <p className="font-bold text-brand-brown group-hover:text-[#25D366] transition-colors">Chat with us</p>
                        </div>
                    </a>

                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-brand-yellow/30 flex items-center justify-center shadow-sm flex-shrink-0">
                            <MapPin size={20} className="text-brand-red" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Find us</p>
                            <p className="font-bold text-brand-brown text-sm leading-relaxed">
                                7/602, Kumaran Nagar, Sulthanpet,<br />Sulur, Coimbatore 641669
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <Footer />
    </div>
);

export default Home;
