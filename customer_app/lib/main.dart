import 'package:flutter/material.dart';
import 'core/api_client.dart';

void main() {
  runApp(const AajoriCustomerApp());
}

class AajoriCustomerApp extends StatelessWidget {
  const AajoriCustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Aajori Cuisine',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFEA580C),
          primary: const Color(0xFFEA580C),
          secondary: const Color(0xFFEAB308),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
        ),
      ),
      home: const CustomerMainNavigationScreen(),
    );
  }
}

// ----------------------------------------------------------------------------
// CART MANAGER (Singleton In-Memory State synced with backend pricing)
// ----------------------------------------------------------------------------
class CartManager {
  static final CartManager instance = CartManager._();
  CartManager._();

  String? currentRestaurantId;
  String? currentRestaurantName;
  final Map<String, Map<String, dynamic>> items = {}; // itemId -> {item, qty}

  void addItem(String restaurantId, String restaurantName, Map<String, dynamic> item) {
    if (currentRestaurantId != null && currentRestaurantId != restaurantId) {
      items.clear(); // Reset cart if from different restaurant
    }
    currentRestaurantId = restaurantId;
    currentRestaurantName = restaurantName;

    final id = item['id'];
    if (items.containsKey(id)) {
      items[id]!['quantity'] = (items[id]!['quantity'] as int) + 1;
    } else {
      items[id] = {'item': item, 'quantity': 1};
    }
  }

  void removeItem(String itemId) {
    if (items.containsKey(itemId)) {
      final currentQty = items[itemId]!['quantity'] as int;
      if (currentQty > 1) {
        items[itemId]!['quantity'] = currentQty - 1;
      } else {
        items.remove(itemId);
      }
    }
    if (items.isEmpty) {
      currentRestaurantId = null;
      currentRestaurantName = null;
    }
  }

  int get totalCount => items.values.fold(0, (acc, e) => acc + (e['quantity'] as int));
  double get estimatedSubtotal => items.values.fold(
      0.0,
      (acc, e) =>
          acc +
          ((e['item']['price'] as num).toDouble() * (e['quantity'] as int)));
}

// ----------------------------------------------------------------------------
// MAIN BOTTOM NAVIGATION SCREEN
// ----------------------------------------------------------------------------
class CustomerMainNavigationScreen extends StatefulWidget {
  const CustomerMainNavigationScreen({super.key});

  @override
  State<CustomerMainNavigationScreen> createState() => _CustomerMainNavigationScreenState();
}

class _CustomerMainNavigationScreenState extends State<CustomerMainNavigationScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _bootstrapCustomerSession();
  }

  Future<void> _bootstrapCustomerSession() async {
    try {
      final res = await ApiClient.post('/auth/dev-login', {'role': 'CUSTOMER'});
      if (res['success'] == true && res['data']?['token'] != null) {
        ApiClient.setToken(res['data']['token']);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(onNavigateToCart: () => setState(() => _currentIndex = 1)),
      CartScreen(onOrderPlaced: () => setState(() => _currentIndex = 2)),
      const OrdersListScreen(),
      const AiAssistantScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: CartManager.instance.totalCount > 0,
              label: Text('${CartManager.instance.totalCount}'),
              child: const Icon(Icons.shopping_bag_outlined),
            ),
            selectedIcon: const Icon(Icons.shopping_bag),
            label: 'Cart',
          ),
          const NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          const NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome),
            label: 'AI Foodie',
          ),
        ],
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// 1. HOME EXPLORE SCREEN
// ----------------------------------------------------------------------------
class HomeScreen extends StatefulWidget {
  final VoidCallback onNavigateToCart;
  const HomeScreen({super.key, required this.onNavigateToCart});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _restaurants = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchRestaurants();
  }

  Future<void> _fetchRestaurants() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.get('/restaurants?lat=26.1550&lng=91.7690');
      if (res['success'] == true) {
        setState(() {
          _restaurants = res['data'] ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Row(
              children: [
                Icon(Icons.location_on, color: Color(0xFFEA580C), size: 16),
                SizedBox(width: 4),
                Text(
                  'Kamrup Metropolitan',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
                Icon(Icons.keyboard_arrow_down, size: 16),
              ],
            ),
            Text(
              'Guwahati Central Delivery Zone',
              style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFEA580C)))
          : RefreshIndicator(
              onRefresh: _fetchRestaurants,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // District Special Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEA580C), Color(0xFFF97316)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Indigenous Assamese Flavours',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Smoked pork, duck with black sesame & heritage thalis delivered hot.',
                                style: TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'AAJORI50',
                            style: TextStyle(
                              color: Color(0xFFEA580C),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        )
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                  const Text(
                    'Featured District Kitchens',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 12),

                  ..._restaurants.map((r) => _buildRestaurantCard(context, r)),
                ],
              ),
            ),
    );
  }

  Widget _buildRestaurantCard(BuildContext context, dynamic r) {
    final cuisines = (r['cuisineTypes'] as List<dynamic>?)?.join(' • ') ?? 'Assamese';
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (ctx) => RestaurantMenuScreen(
                restaurantId: r['id'],
                restaurantName: r['name'],
              ),
            ),
          ).then((_) => setState(() {}));
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Image.network(
                  r['coverUrl'] ?? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500',
                  height: 140,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(height: 140, color: Colors.grey[200]),
                ),
                Positioned(
                  bottom: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '~${r['avgPrepTimeMinutes'] ?? 25} mins',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                )
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          r['name'],
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF15803D),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '★ ${r['rating'] ?? 4.8}',
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    cuisines,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${r['addressLine']} • ₹${r['minOrderAmount']} min order',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// 2. RESTAURANT MENU SCREEN
// ----------------------------------------------------------------------------
class RestaurantMenuScreen extends StatefulWidget {
  final String restaurantId;
  final String restaurantName;

  const RestaurantMenuScreen({
    super.key,
    required this.restaurantId,
    required this.restaurantName,
  });

  @override
  State<RestaurantMenuScreen> createState() => _RestaurantMenuScreenState();
}

class _RestaurantMenuScreenState extends State<RestaurantMenuScreen> {
  Map<String, dynamic>? _menuData;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchMenu();
  }

  Future<void> _fetchMenu() async {
    try {
      final res = await ApiClient.get('/restaurants/${widget.restaurantId}/menu');
      if (res['success'] == true) {
        setState(() {
          _menuData = res['data'];
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.restaurantName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFEA580C)))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                ...(_menuData?['categories'] as List<dynamic>? ?? []).map((cat) {
                  final items = cat['items'] as List<dynamic>? ?? [];
                  if (items.isEmpty) return const SizedBox.shrink();

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          cat['name'],
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                      ),
                      ...items.map((item) => _buildItemTile(item)),
                      const SizedBox(height: 12),
                    ],
                  );
                }),
              ],
            ),
      bottomNavigationBar: CartManager.instance.totalCount > 0
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${CartManager.instance.totalCount} items added'),
                    const Text('View Cart →', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildItemTile(dynamic item) {
    final itemId = item['id'];
    final inCartQty = CartManager.instance.items[itemId]?['quantity'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.circle,
                      size: 10,
                      color: item['isVeg'] == true ? const Color(0xFF15803D) : const Color(0xFFE11D48),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        item['name'],
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${item['price']}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                ),
                const SizedBox(height: 4),
                Text(
                  item['description'] ?? '',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            children: [
              if (item['imageUrl'] != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    item['imageUrl'],
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(width: 70, height: 70, color: Colors.grey[200]),
                  ),
                ),
              const SizedBox(height: 6),
              inCartQty > 0
                  ? Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFEA580C),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.remove, color: Colors.white, size: 16),
                            onPressed: () {
                              setState(() => CartManager.instance.removeItem(itemId));
                            },
                          ),
                          Text(
                            '$inCartQty',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.add, color: Colors.white, size: 16),
                            onPressed: () {
                              setState(() => CartManager.instance.addItem(widget.restaurantId, widget.restaurantName, item));
                            },
                          ),
                        ],
                      ),
                    )
                  : OutlinedButton(
                      onPressed: () {
                        setState(() => CartManager.instance.addItem(widget.restaurantId, widget.restaurantName, item));
                      },
                      style: OutlinedButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        foregroundColor: const Color(0xFFEA580C),
                        side: const BorderSide(color: Color(0xFFEA580C)),
                      ),
                      child: const Text('ADD'),
                    ),
            ],
          )
        ],
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// 3. CART & CHECKOUT SCREEN (Backend Authoritative Pricing Engine)
// ----------------------------------------------------------------------------
class CartScreen extends StatefulWidget {
  final VoidCallback onOrderPlaced;
  const CartScreen({super.key, required this.onOrderPlaced});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  Map<String, dynamic>? _pricingResult;
  bool _calculating = false;
  bool _placingOrder = false;
  String _couponCode = 'AAJORI50';

  @override
  void initState() {
    super.initState();
    _recalculatePrice();
  }

  Future<void> _recalculatePrice() async {
    if (CartManager.instance.items.isEmpty || CartManager.instance.currentRestaurantId == null) {
      setState(() => _pricingResult = null);
      return;
    }

    setState(() => _calculating = true);
    try {
      final itemsPayload = CartManager.instance.items.values.map((e) {
        return {
          'menuItemId': e['item']['id'],
          'quantity': e['quantity'],
        };
      }).toList();

      final res = await ApiClient.post('/pricing/calculate', {
        'restaurantId': CartManager.instance.currentRestaurantId,
        'customerLocation': {'latitude': 26.1550, 'longitude': 91.7690},
        'items': itemsPayload,
        'couponCode': _couponCode.trim().isNotEmpty ? _couponCode.trim() : null,
      });

      if (res['success'] == true) {
        setState(() {
          _pricingResult = res['data']?['pricing'];
          _calculating = false;
        });
      } else {
        setState(() => _calculating = false);
      }
    } catch (_) {
      setState(() => _calculating = false);
    }
  }

  Future<void> _placeOrder() async {
    setState(() => _placingOrder = true);
    try {
      final itemsPayload = CartManager.instance.items.values.map((e) {
        return {
          'menuItemId': e['item']['id'],
          'quantity': e['quantity'],
        };
      }).toList();

      final res = await ApiClient.post('/orders', {
        'restaurantId': CartManager.instance.currentRestaurantId,
        'deliveryAddressId': 'b0000000-0000-0000-0000-000000000001', // Brahmaputra Enclave
        'paymentMethod': 'UPI',
        'customerInstructions': 'Please send bamboo shoot chutney',
        'couponCode': _couponCode.trim().isNotEmpty ? _couponCode.trim() : null,
        'items': itemsPayload,
      });

      if (res['success'] == true) {
        CartManager.instance.items.clear();
        CartManager.instance.currentRestaurantId = null;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order placed successfully!')),
        );
        widget.onOrderPlaced();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['error']?['message'] ?? 'Failed to place order')),
        );
      }
    } finally {
      setState(() => _placingOrder = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (CartManager.instance.items.isEmpty) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.shopping_bag_outlined, size: 64, color: Colors.grey),
              SizedBox(height: 12),
              Text('Your food cart is empty', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text('Discover authentic kitchens in Kamrup district', style: TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          CartManager.instance.currentRestaurantName ?? 'Cart',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Items List
          ...CartManager.instance.items.values.map((e) {
            final item = e['item'];
            final qty = e['quantity'];
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Text('${qty}x', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  Expanded(child: Text(item['name'], style: const TextStyle(fontSize: 13))),
                  Text('₹${(item['price'] * qty).toStringAsFixed(1)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            );
          }),

          const Divider(height: 32),

          // Coupon Field
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Enter coupon code (e.g. AAJORI50)',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  controller: TextEditingController(text: _couponCode),
                  onChanged: (val) => _couponCode = val,
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _recalculatePrice,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white),
                child: const Text('Apply'),
              ),
            ],
          ),

          const SizedBox(height: 24),
          const Text('Bill Details (Authoritative Backend Engine)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),

          if (_calculating)
            const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
          else if (_pricingResult != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _billRow('Item Subtotal', '₹${_pricingResult!['subtotal']}'),
                  _billRow('Packaging Fee', '₹${_pricingResult!['packagingFee']}'),
                  _billRow('Delivery Fee (${_pricingResult!['deliveryDistanceKm']} km)', '₹${_pricingResult!['deliveryFee']}'),
                  _billRow('District Platform Fee', '₹${_pricingResult!['platformFee']}'),
                  _billRow('GST Taxes (5%)', '₹${_pricingResult!['taxAmount']}'),
                  if ((_pricingResult!['discountAmount'] as num) > 0)
                    _billRow(
                      'Coupon Discount',
                      '-₹${_pricingResult!['discountAmount']}',
                      color: const Color(0xFF15803D),
                    ),
                  const Divider(height: 24),
                  _billRow(
                    'To Pay',
                    '₹${_pricingResult!['totalCustomerPrice']}',
                    isBold: true,
                    fontSize: 16,
                  ),
                ],
              ),
            ),

          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _placingOrder ? null : _placeOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEA580C),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _placingOrder
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Confirm & Place Order (UPI / COD)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ),
        ],
      ),
    );
  }

  Widget _billRow(String label, String value, {bool isBold = false, double fontSize = 13, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(
            value,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: color ?? (isBold ? const Color(0xFFEA580C) : const Color(0xFF0F172A)),
            ),
          ),
        ],
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// 4. ORDERS LIST & TRACKING SCREEN
// ----------------------------------------------------------------------------
class OrdersListScreen extends StatefulWidget {
  const OrdersListScreen({super.key});

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen> {
  List<dynamic> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.get('/orders');
      if (res['success'] == true) {
        setState(() {
          _orders = res['data'] ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orders', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(onPressed: _fetchOrders, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFEA580C)))
          : RefreshIndicator(
              onRefresh: _fetchOrders,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _orders.length,
                itemBuilder: (ctx, i) {
                  final ord = _orders[i];
                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(ord['orderNumber'], style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF7ED),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFFED7AA)),
                                ),
                                child: Text(
                                  (ord['status'] as String).replaceAll('_', ' '),
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFC2410C)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Total: ₹${ord['pricing']?['totalCustomerPrice']} • ${(ord['items'] as List<dynamic>?)?.length ?? 0} items',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Destination: ${ord['deliveryAddress']?['addressLine1'] ?? 'Guwahati'}',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}

// ----------------------------------------------------------------------------
// 5. AI FOOD ASSISTANT CONVERSATIONAL SCREEN
// ----------------------------------------------------------------------------
class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final TextEditingController _controller = TextEditingController(text: 'I want something spicy for 2 people under ₹500');
  Map<String, dynamic>? _recommendations;
  bool _loading = false;

  Future<void> _askAi() async {
    final query = _controller.text.trim();
    if (query.isEmpty) return;

    setState(() => _loading = true);
    try {
      final res = await ApiClient.post('/ai/recommend', {'message': query});
      if (res['success'] == true) {
        setState(() {
          _recommendations = res['data'];
          _loading = false;
        });
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Food Assistant', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: const Text(
              '💡 Tell me your cravings, budget & number of people. All suggestions are grounded strictly in real menus in Kamrup.',
              style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: const InputDecoration(
                    hintText: 'e.g. Duck curry under ₹400',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _loading ? null : _askAi,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  foregroundColor: Colors.white,
                ),
                child: _loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Ask AI'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (_recommendations != null) ...[
            const Text('Grounded Recommendations:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            ...(_recommendations!['suggestions'] as List<dynamic>? ?? []).map((sug) {
              return Card(
                elevation: 0,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(sug['restaurant']['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          Text('Combo: ₹${sug['comboTotal']}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFEA580C))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ...((sug['items'] as List<dynamic>?) ?? []).map((item) => Text('• ${item['name']} (₹${item['price']})', style: const TextStyle(fontSize: 12))),
                      const SizedBox(height: 8),
                      Text(sug['reason'] ?? '', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF64748B))),
                    ],
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}
