import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zamaneps.com' },
    update: {},
    create: {
      email: 'admin@zamaneps.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: customerPassword,
      firstName: 'Test',
      lastName: 'Customer',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });
  console.log('✅ Test customer created:', customer.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'watches' },
      update: {},
      create: {
        name: 'Watches',
        nameAr: 'ساعات',
        slug: 'watches',
        description: 'Luxury and designer watches',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'bags' },
      update: {},
      create: {
        name: 'Bags',
        nameAr: 'حقائب',
        slug: 'bags',
        description: 'Designer handbags and accessories',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'jewelry' },
      update: {},
      create: {
        name: 'Jewelry',
        nameAr: 'مجوهرات',
        slug: 'jewelry',
        description: 'Elegant jewelry and accessories',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'wallets' },
      update: {},
      create: {
        name: 'Wallets',
        nameAr: 'محافظ',
        slug: 'wallets',
        description: 'Designer wallets and card holders',
        sortOrder: 4,
      },
    }),
  ]);
  console.log('✅ Categories created:', categories.length);

  // Create sample products
  const products = [
    {
      name: 'AP Premium Automatic Chronograph Watch',
      nameAr: 'ساعة AP أوتوماتيكية',
      slug: 'ap-premium-automatic-chronograph-watch',
      description: 'Stunning automatic chronograph watch featuring stainless steel construction, sapphire crystal, calendar function, and multifunction movement. Perfect for the modern gentleman.',
      descriptionAr: 'ساعة كرونوغراف أوتوماتيكية رائعة',
      price: 169.99,
      compareAtPrice: 189.99,
      quantity: 15,
      categorySlug: 'watches',
      isFeatured: true,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      ],
    },
    {
      name: 'Armani Men Watch',
      nameAr: 'ساعة أرماني رجالية',
      slug: 'armani-men-watch',
      description: 'Elegant Armani timepiece for the sophisticated man. Features premium materials and impeccable design.',
      price: 170.00,
      compareAtPrice: 190.99,
      quantity: 10,
      categorySlug: 'watches',
      isFeatured: true,
      images: [
        'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800',
      ],
    },
    {
      name: 'Authentic Dior Lady Dior Medium',
      nameAr: 'حقيبة ديور ليدي ديور',
      slug: 'authentic-dior-lady-dior-medium',
      description: 'The iconic Lady Dior bag in medium size. Crafted with premium materials and featuring the signature Dior design.',
      price: 119.99,
      compareAtPrice: 129.99,
      quantity: 8,
      categorySlug: 'bags',
      isFeatured: true,
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
      ],
    },
    {
      name: "Coach Women's Lana Shoulder Bag",
      nameAr: 'حقيبة كوتش لانا',
      slug: 'coach-womens-lana-shoulder-bag',
      description: 'Beautiful Coach Lana shoulder bag. Perfect for everyday elegance.',
      price: 70.00,
      compareAtPrice: 75.00,
      quantity: 12,
      categorySlug: 'bags',
      isFeatured: true,
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
      ],
    },
    {
      name: 'Cute Cherry Bag Charm Pendant Keychain',
      nameAr: 'سلسلة مفاتيح كرز',
      slug: 'cute-cherry-bag-charm-keychain',
      description: "Adorable cherry bag charm pendant. Perfect accessory for any handbag.",
      price: 15.00,
      compareAtPrice: 20.00,
      quantity: 50,
      categorySlug: 'jewelry',
      isFeatured: false,
      images: [
        'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800',
      ],
    },
    {
      name: 'Elegant Marquise-Cut Crystal Tennis Bracelet',
      nameAr: 'سوار تنس كريستال',
      slug: 'elegant-marquise-cut-crystal-tennis-bracelet',
      description: 'Stunning tennis bracelet featuring marquise-cut crystals in a silver finish. Perfect for special occasions.',
      price: 25.00,
      quantity: 30,
      categorySlug: 'jewelry',
      isFeatured: true,
      images: [
        'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800',
      ],
    },
    {
      name: "Louis Vuitton Men's Bifold Wallet",
      nameAr: 'محفظة لويس فيتون رجالية',
      slug: 'louis-vuitton-mens-bifold-wallet',
      description: 'Classic Louis Vuitton bifold wallet in Damier Graphite Black Canvas/Leather. Brand new.',
      price: 29.99,
      compareAtPrice: 49.99,
      quantity: 20,
      categorySlug: 'wallets',
      isFeatured: true,
      images: [
        'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
      ],
    },
    {
      name: 'Luxury Women Bracelet',
      nameAr: 'سوار نسائي فاخر',
      slug: 'luxury-women-bracelet',
      description: 'Elegant luxury bracelet for women. Features premium materials and sophisticated design.',
      price: 24.99,
      compareAtPrice: 39.99,
      quantity: 25,
      categorySlug: 'jewelry',
      isFeatured: true,
      images: [
        'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
      ],
    },
  ];

  for (const productData of products) {
    const category = categories.find(c => c.slug === productData.categorySlug);
    if (!category) continue;

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        name: productData.name,
        nameAr: productData.nameAr,
        slug: productData.slug,
        description: productData.description,
        descriptionAr: productData.descriptionAr,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        quantity: productData.quantity,
        categoryId: category.id,
        isFeatured: productData.isFeatured,
        images: {
          create: productData.images.map((url, index) => ({
            url,
            alt: productData.name,
            sortOrder: index,
          })),
        },
      },
    });
    console.log('✅ Product created:', product.name);
  }

  // Create discount codes
  const discounts = await Promise.all([
    prisma.discountCode.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        isActive: true,
      },
    }),
    prisma.discountCode.upsert({
      where: { code: 'SAVE20' },
      update: {},
      create: {
        code: 'SAVE20',
        type: 'FIXED_AMOUNT',
        value: 20,
        minOrderAmount: 100,
        isActive: true,
      },
    }),
    prisma.discountCode.upsert({
      where: { code: 'FREESHIP' },
      update: {},
      create: {
        code: 'FREESHIP',
        type: 'FREE_SHIPPING',
        value: 0,
        minOrderAmount: 50,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Discount codes created:', discounts.length);

  // Create store settings
  const settings = [
    { key: 'store_name', value: 'Zamanẻ ps' },
    { key: 'store_email', value: 'info@zamaneps.com' },
    { key: 'store_phone', value: '+972-XXX-XXXX' },
    { key: 'currency', value: 'ILS' },
    { key: 'tax_rate', value: 17 },
    { key: 'free_shipping_threshold', value: 200 },
    { key: 'shipping_rate', value: 25 },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }
  console.log('✅ Store settings created');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Test accounts:');
  console.log('   Admin: admin@zamaneps.com / admin123');
  console.log('   Customer: customer@test.com / customer123');
  console.log('');
  console.log('🎟️  Discount codes: WELCOME10, SAVE20, FREESHIP');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
