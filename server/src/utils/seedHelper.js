const User = require('../models/User');
const RawMaterial = require('../models/RawMaterial');
const Product = require('../models/Product');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');

const populateSampleData = async ({ clearExisting = false } = {}) => {
  if (clearExisting) {
    await Promise.all([
      User.deleteMany({}),
      RawMaterial.deleteMany({}),
      Product.deleteMany({}),
      Inquiry.deleteMany({}),
      Order.deleteMany({}),
    ]);
  }

  const [rawSupplier, productSupplier, rawCustomer, productCustomer] = await User.create([
    {
      name: 'Nimal Perera',
      email: 'rawsupplier@tradehub.demo',
      password: 'Password123!',
      role: 'raw_material_supplier',
      companyName: 'Lanka Industrial Materials Ltd.',
      phone: '+94 11 234 5678',
      location: 'Colombo, Sri Lanka',
    },
    {
      name: 'Kavindi Silva',
      email: 'productsupplier@tradehub.demo',
      password: 'Password123!',
      role: 'product_supplier',
      companyName: 'Apex Precision Goods Co.',
      phone: '+94 11 876 5432',
      location: 'Kandy, Sri Lanka',
    },
    {
      name: 'Ruwan Fernando',
      email: 'rawcustomer@tradehub.demo',
      password: 'Password123!',
      role: 'raw_material_customer',
      companyName: 'Ceylon Craft Manufacturing',
      phone: '+94 77 112 2334',
      location: 'Gampaha, Sri Lanka',
    },
    {
      name: 'Dilshan Jayawardena',
      email: 'productcustomer@tradehub.demo',
      password: 'Password123!',
      role: 'product_customer',
      companyName: 'Metro Retail Distributors',
      phone: '+94 71 998 8776',
      location: 'Galle, Sri Lanka',
    },
  ]);

  const materials = await RawMaterial.create([
    {
      title: 'Grade-A Natural Rubber Sheets (RSS-1)',
      category: 'Rubber & Polymers',
      description: 'Smoked natural rubber sheets suitable for industrial tires, conveyor belts, and molded components.',
      pricePerUnit: 2.45,
      unit: 'kg',
      minOrderQuantity: 500,
      availableQuantity: 25000,
      location: 'Colombo, Sri Lanka',
      specifications: 'Moisture < 0.8%, Dirt content < 0.05%, Packaged in 33.3 kg bales',
      supplier: rawSupplier._id,
    },
    {
      title: 'Cold-Rolled Stainless Steel 304 Coils',
      category: 'Metals & Alloys',
      description: 'Corrosion-resistant 304 stainless steel coils, 1.5mm thickness, ready for fabrication and stamping.',
      pricePerUnit: 2850,
      unit: 'ton',
      minOrderQuantity: 2,
      availableQuantity: 45,
      location: 'Colombo Port Zone',
      specifications: '2B finish, 1219mm width, ISO 9001 certified mill test certificate included',
      supplier: rawSupplier._id,
    },
    {
      title: 'Organic Combed Cotton Yarn (40s Ne)',
      category: 'Textiles & Fibers',
      description: 'Ring-spun 100% organic combed cotton yarn for high-density apparel weaving and knitting.',
      pricePerUnit: 4.8,
      unit: 'kg',
      minOrderQuantity: 200,
      availableQuantity: 12000,
      location: 'Katunayake, Sri Lanka',
      specifications: 'GOTS certified, cone weight 1.89 kg, uniform tensile strength',
      supplier: rawSupplier._id,
    },
  ]);

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const products = await Product.create([
    {
      title: 'Industrial CNC Aluminum Enclosure Batch (50 Units)',
      category: 'Industrial Hardware',
      description: 'Precision-milled IP67 waterproof aluminum enclosures anodized in matte black for outdoor electronics.',
      pricingType: 'fixed',
      fixedPrice: 1450,
      stockQuantity: 18,
      location: 'Kandy, Sri Lanka',
      supplier: productSupplier._id,
    },
    {
      title: 'Commercial Solar Inverter 10kW Hybrid',
      category: 'Energy & Electronics',
      description: 'Three-phase hybrid solar inverter with dual MPPT trackers, Wi-Fi monitoring, and 5-year warranty.',
      pricingType: 'fixed',
      fixedPrice: 1890,
      stockQuantity: 10,
      location: 'Kandy, Sri Lanka',
      supplier: productSupplier._id,
    },
    {
      title: 'Limited Edition Automated Espresso Machine (Commercial)',
      category: 'Hospitality Equipment',
      description: 'Dual-boiler stainless steel commercial espresso machine with PID temperature control. Open for competitive live auction.',
      pricingType: 'auction',
      startingPrice: 2200,
      currentBid: 2450,
      minBidIncrement: 50,
      auctionStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      auctionEndTime: inThreeDays,
      highestBidder: productCustomer._id,
      bids: [
        { bidder: productCustomer._id, amount: 2450 },
        { bidder: productCustomer._id, amount: 2300 },
      ],
      location: 'Kandy, Sri Lanka',
      supplier: productSupplier._id,
    },
    {
      title: 'Heavy-Duty Hydraulic Pallet Jack Fleet (Lot of 5)',
      category: 'Warehouse Equipment',
      description: 'Lot of 5 brand-new 3-ton capacity hydraulic pallet trucks with polyurethane wheels. Live auction lot.',
      pricingType: 'auction',
      startingPrice: 1600,
      currentBid: 0,
      minBidIncrement: 25,
      auctionStartTime: now,
      auctionEndTime: inFiveDays,
      location: 'Kandy, Sri Lanka',
      supplier: productSupplier._id,
    },
  ]);

  await Inquiry.create([
    {
      itemType: 'raw_material',
      rawMaterial: materials[0]._id,
      customer: rawCustomer._id,
      supplier: rawSupplier._id,
      subject: 'Bulk quote request for 5,000 kg RSS-1 Rubber',
      messages: [
        {
          sender: rawCustomer._id,
          text: 'Hello, can you provide a bulk discount and lead time for 5,000 kg delivered to Gampaha?',
        },
        {
          sender: rawSupplier._id,
          text: 'Hi Ruwan! For 5,000 kg we can offer $2.30/kg with delivery within 4 business days.',
        },
      ],
      status: 'replied',
    },
    {
      itemType: 'product',
      product: products[2]._id,
      customer: productCustomer._id,
      supplier: productSupplier._id,
      subject: 'Warranty & shipping inquiry for Espresso Machine auction',
      messages: [
        {
          sender: productCustomer._id,
          text: 'Does the auction winner receive full installation support and a 2-year parts warranty?',
        },
      ],
      status: 'open',
    },
  ]);

  console.log('Demo data seeded! Accounts (password: Password123!):');
  console.log('  rawsupplier@tradehub.demo | productsupplier@tradehub.demo | rawcustomer@tradehub.demo | productcustomer@tradehub.demo');
};

const seedIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await populateSampleData({ clearExisting: false });
  }
};

module.exports = { populateSampleData, seedIfEmpty };
