import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero_sweets.png';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getApiUrl } from '../utils/api';
import { Plus, Minus, CheckCircle, ArrowLeft, ShoppingBag, User, Phone, Mail, MapPin, Calendar, Clock, Users, Info } from 'lucide-react';

import product1 from '../assets/product_1.jpeg';
import product2 from '../assets/product_2.jpeg';
import product3 from '../assets/product_3.jpeg';
import product4 from '../assets/product_4.jpeg';

const defaultProducts = [
    { _id: 'd1', name: 'Elaneer Payasam', unit: 'Piece', imageUrl: product1, description: 'Fresh tender coconut payasam, made to order' },
    { _id: 'd2', name: 'Jigirthanda', unit: 'Piece', imageUrl: product2, description: 'Madurai-style jigirthanda, chilled to perfection' },
    { _id: 'd3', name: 'Sweet Beeda', unit: 'Piece', imageUrl: product3, description: 'Traditional sweet beeda with aromatic spices' },
    { _id: 'd4', name: 'Ice Creams', unit: 'Piece', imageUrl: product4, description: 'Homemade ice creams in traditional Indian flavours' },
];

const localImageMap = {
    'elaneer payasam': product1,
    'jigirthanda': product2,
    'sweet beeda': product3,
    'ice creams': product4,
};

function withLocalImage(p) {
    const key = p.name?.toLowerCase().trim();
    return { ...p, imageUrl: p.imageUrl || localImageMap[key] || product1 };
}

const EVENT_TYPES = ['Wedding', 'Birthday Party', 'Corporate Event', 'Religious Function', 'Graduation', 'Anniversary', 'Get-together', 'Other'];
const BUDGET_RANGES = ['Under ₹5,000', '₹5,000 – ₹10,000', '₹10,000 – ₹25,000', '₹25,000 – ₹50,000', 'Above ₹50,000'];
const HEAR_OPTIONS = ['Instagram', 'Friend / Family Referral', 'Local Shop', 'Google Search', 'WhatsApp', 'Other'];

const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none bg-gray-50 focus:bg-white transition-colors text-sm";
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

const SectionCard = ({ number, icon, title, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="text-xl font-bold text-brand-brown mb-6 flex items-center gap-3">
            <span className="w-9 h-9 bg-brand-red text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{number}</span>
            <span className="flex items-center gap-2">{icon} {title}</span>
        </h3>
        {children}
    </div>
);

const Order = () => {
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState({});
    const [formData, setFormData] = useState({
        eventName: '', eventType: '',
        eventDate: '', deliveryTime: '', eventLocation: '', guestCount: '',
        contactPerson: '', contactNumber: '', contactEmail: '',
        secondaryContactPerson: '', secondaryContactNumber: '', secondaryContactRelation: '',
        specialInstructions: '', budgetRange: '', howDidYouHear: '',
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetch(`${getApiUrl()}/products`)
            .then(r => r.json())
            .then(d => setProducts(d.products?.length > 0 ? d.products.map(withLocalImage) : defaultProducts))
            .catch(() => setProducts(defaultProducts))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = e => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleProductToggle = id => {
        setSelectedProducts(prev => {
            if (prev[id]) { const { [id]: _, ...rest } = prev; return rest; }
            return { ...prev, [id]: 1 };
        });
    };

    const handleQtyChange = (id, delta) =>
        setSelectedProducts(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));

    const handleQtyInput = (id, val) =>
        setSelectedProducts(prev => ({ ...prev, [id]: Math.max(1, parseInt(val) || 1) }));

    const handleSubmit = async e => {
        e.preventDefault();
        if (Object.keys(selectedProducts).length === 0) {
            setStatus({ type: 'error', message: 'Please select at least one product for your event.' });
            return;
        }
        setStatus({ type: 'loading', message: '' });

        const itemsList = Object.entries(selectedProducts)
            .map(([id, qty]) => { const p = products.find(x => x._id === id); return `${p?.name} × ${qty}`; })
            .join(', ');

        const productsPayload = Object.entries(selectedProducts).map(([id, qty]) => {
            const p = products.find(x => x._id === id);
            return { productId: p?._id, productName: p?.name, quantity: qty, unit: p?.unit };
        });

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(`${getApiUrl()}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, itemsRequired: itemsList, productsPayload }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (res.ok) setSubmitted(true);
            else setStatus({ type: 'error', message: data.message || 'Failed to submit. Please try again.' });
        } catch (err) {
            if (err.name === 'AbortError') {
                setStatus({ type: 'error', message: 'Request timed out. The server may be starting up — please try again in 30 seconds.' });
            } else {
                setStatus({ type: 'error', message: `Error: ${err.message}. Please try again.` });
            }
        }
    };

    const selectedCount = Object.keys(selectedProducts).length;

    // ── Success ──
    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar />
                <div className="flex-grow flex items-center justify-center px-4 py-20">
                    <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-100 p-5 rounded-full">
                                <CheckCircle size={52} className="text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-brand-brown mb-3 font-serif">Order Request Submitted!</h2>
                        <p className="text-gray-600 mb-2">Thank you, <strong>{formData.contactPerson}</strong>! We've received your event order request.</p>
                        <p className="text-gray-600 mb-8">Our team will <strong>contact you within 24 hours</strong> to confirm the details.</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { setSubmitted(false); setFormData({ eventName: '', eventType: '', eventDate: '', deliveryTime: '', eventLocation: '', guestCount: '', contactPerson: '', contactNumber: '', contactEmail: '', secondaryContactPerson: '', secondaryContactNumber: '', secondaryContactRelation: '', specialInstructions: '', budgetRange: '', howDidYouHear: '' }); setSelectedProducts({}); }}
                                className="w-full bg-brand-red text-white py-3 rounded-full font-bold hover:bg-red-700 transition-all"
                            >Submit Another Order</button>
                            <Link to="/" className="flex items-center justify-center gap-2 text-brand-brown font-medium hover:text-brand-red transition-colors">
                                <ArrowLeft size={18} /> Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto" />
                <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50">
            <Navbar />
            <div className="flex-grow">

                {/* Hero */}
                <div className="relative h-56 md:h-72">
                    <div className="absolute inset-0">
                        <img src={heroImage} alt="Ammu Foods" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/55" />
                    </div>
                    <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white drop-shadow-md mb-3">Order for Your Event</h1>
                        <p className="text-base md:text-lg text-brand-yellow font-medium max-w-xl bg-black/30 px-5 py-2 rounded-full backdrop-blur-sm">
                            Make your celebrations sweeter with Ammu Foods
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="container mx-auto px-4 py-12 -mt-8 relative z-10">
                    <div className="max-w-5xl mx-auto">

                        {status.type === 'error' && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-sm font-medium flex items-center gap-2">
                                ⚠️ {status.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* ── 1. Event Details ── */}
                            <SectionCard number="1" icon={<Calendar size={20} className="text-brand-red" />} title="Event Details">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelCls}>Event Name *</label>
                                        <input type="text" name="eventName" value={formData.eventName} onChange={handleChange} required
                                            placeholder="e.g. Ravi & Priya's Wedding" className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Event Type *</label>
                                        <select name="eventType" value={formData.eventType} onChange={handleChange} required className={inputCls}>
                                            <option value="">Select event type</option>
                                            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Event Date *</label>
                                        <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} required
                                            min={new Date().toISOString().split('T')[0]} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Delivery Time *</label>
                                        <input type="time" name="deliveryTime" value={formData.deliveryTime} onChange={handleChange} required className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Expected Guest Count *</label>
                                        <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} required
                                            min="1" placeholder="Number of guests" className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Approximate Budget</label>
                                        <select name="budgetRange" value={formData.budgetRange} onChange={handleChange} className={inputCls}>
                                            <option value="">Select budget range (optional)</option>
                                            {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelCls}><MapPin size={14} className="inline mr-1 text-brand-red" />Event Venue / Location *</label>
                                        <input type="text" name="eventLocation" value={formData.eventLocation} onChange={handleChange} required
                                            placeholder="Full venue name and address" className={inputCls} />
                                    </div>
                                </div>
                            </SectionCard>

                            {/* ── 2. Primary Contact ── */}
                            <SectionCard number="2" icon={<User size={20} className="text-brand-red" />} title="Primary Contact">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelCls}><User size={13} className="inline mr-1" />Full Name *</label>
                                        <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required
                                            placeholder="Your full name" className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}><Phone size={13} className="inline mr-1" />Mobile Number *</label>
                                        <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required
                                            pattern="[0-9]{10}" placeholder="10-digit mobile number" className={inputCls} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelCls}><Mail size={13} className="inline mr-1" />Email Address <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                                            placeholder="your@email.com" className={inputCls} />
                                    </div>
                                </div>
                            </SectionCard>

                            {/* ── 3. Secondary Contact ── */}
                            <SectionCard number="3" icon={<Users size={20} className="text-brand-red" />} title="Secondary Contact">
                                <p className="text-sm text-gray-500 -mt-3 mb-5">Optional — add an alternate person we can reach if needed.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className={labelCls}>Full Name</label>
                                        <input type="text" name="secondaryContactPerson" value={formData.secondaryContactPerson} onChange={handleChange}
                                            placeholder="Alternate contact name" className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Mobile Number</label>
                                        <input type="tel" name="secondaryContactNumber" value={formData.secondaryContactNumber} onChange={handleChange}
                                            pattern="[0-9]{10}" placeholder="10-digit mobile number" className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Relation / Role</label>
                                        <input type="text" name="secondaryContactRelation" value={formData.secondaryContactRelation} onChange={handleChange}
                                            placeholder="e.g. Bride's Father, Event Manager" className={inputCls} />
                                    </div>
                                </div>
                            </SectionCard>

                            {/* ── 4. Select Products ── */}
                            <SectionCard number="4" icon={<ShoppingBag size={20} className="text-brand-red" />} title={
                                <span className="flex items-center gap-2 flex-1">
                                    Select Products *
                                    {selectedCount > 0 && (
                                        <span className="ml-2 text-sm font-semibold text-brand-red bg-red-50 px-3 py-0.5 rounded-full">
                                            {selectedCount} selected
                                        </span>
                                    )}
                                </span>
                            }>
                                <p className="text-sm text-gray-500 -mt-3 mb-5">Tap a product to select it, then set the approximate quantity needed.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {products.map(product => {
                                        const isSelected = !!selectedProducts[product._id];
                                        return (
                                            <div
                                                key={product._id}
                                                onClick={() => handleProductToggle(product._id)}
                                                className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border-2 group
                                                    ${isSelected ? 'border-brand-red shadow-lg shadow-brand-red/10 scale-[1.01]' : 'border-gray-100 hover:border-brand-yellow/60 hover:shadow-md'}`}
                                            >
                                                <div className="relative h-48 bg-[#FFF5E1] overflow-hidden">
                                                    <img src={product.imageUrl} alt={product.name}
                                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                                    {isSelected && (
                                                        <div className="absolute top-3 right-3 bg-brand-red text-white rounded-full p-1.5 shadow-md">
                                                            <CheckCircle size={18} />
                                                        </div>
                                                    )}
                                                    {!isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-brand-brown text-xs font-bold px-3 py-1.5 rounded-full shadow">
                                                                Tap to select
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`p-4 transition-colors ${isSelected ? 'bg-red-50' : 'bg-white'}`}>
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-900 text-base font-serif">{product.name}</h4>
                                                        <input type="checkbox" checked={isSelected}
                                                            onChange={() => handleProductToggle(product._id)}
                                                            onClick={e => e.stopPropagation()}
                                                            className="w-5 h-5 text-brand-red focus:ring-brand-yellow rounded cursor-pointer flex-shrink-0 mt-0.5" />
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{product.description}</p>
                                                    {isSelected && (
                                                        <div className="flex items-center justify-between bg-white rounded-xl border border-brand-red/20 p-2"
                                                            onClick={e => e.stopPropagation()}>
                                                            <span className="text-xs font-semibold text-gray-600 ml-1">Approx. Qty</span>
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={() => handleQtyChange(product._id, -1)}
                                                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors">
                                                                    <Minus size={14} />
                                                                </button>
                                                                <input type="number" min="1" value={selectedProducts[product._id]}
                                                                    onChange={e => handleQtyInput(product._id, e.target.value)}
                                                                    className="w-14 text-center font-bold text-base border border-gray-200 rounded-lg focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none py-1" />
                                                                <button type="button" onClick={() => handleQtyChange(product._id, 1)}
                                                                    className="w-8 h-8 rounded-lg bg-brand-red text-white hover:bg-red-700 flex items-center justify-center transition-colors">
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedCount > 0 && (
                                    <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <p className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                                            <ShoppingBag size={15} /> Order Summary
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(selectedProducts).map(([id, qty]) => {
                                                const p = products.find(x => x._id === id);
                                                return (
                                                    <span key={id} className="bg-white border border-green-200 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                                                        {p?.name} × {qty}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </SectionCard>

                            {/* ── 5. Additional Info ── */}
                            <SectionCard number="5" icon={<Info size={20} className="text-brand-red" />} title="Additional Information">
                                <div className="space-y-5">
                                    <div>
                                        <label className={labelCls}>Special Instructions / Requests</label>
                                        <textarea name="specialInstructions" value={formData.specialInstructions} onChange={handleChange} rows="3"
                                            placeholder="Dietary requirements, packaging preferences, specific flavours, delivery instructions..."
                                            className={`${inputCls} resize-none`} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>How did you hear about us?</label>
                                        <select name="howDidYouHear" value={formData.howDidYouHear} onChange={handleChange} className={inputCls}>
                                            <option value="">Select an option (optional)</option>
                                            {HEAR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* ── Submit ── */}
                            <button type="submit" disabled={status.type === 'loading'}
                                className="w-full bg-brand-red text-white font-bold py-4 px-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                                {status.type === 'loading' ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                        Submitting your request...
                                    </span>
                                ) : '🎉 Submit Order Request'}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Order;
