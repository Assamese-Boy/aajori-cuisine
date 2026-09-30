import 'package:flutter/material.dart';
import 'core/api_client.dart';

void main() {
  runApp(const AajoriDeliveryApp());
}

class AajoriDeliveryApp extends StatelessWidget {
  const AajoriDeliveryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Aajori Rider',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2563EB),
          primary: const Color(0xFF2563EB),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      home: const RiderMainScreen(),
    );
  }
}

class RiderMainScreen extends StatefulWidget {
  const RiderMainScreen({super.key});

  @override
  State<RiderMainScreen> createState() => _RiderMainScreenState();
}

class _RiderMainScreenState extends State<RiderMainScreen> {
  bool _isOnline = true;
  bool _loading = true;
  List<dynamic> _broadcasts = [];
  List<dynamic> _assignedOrders = [];
  Map<String, dynamic>? _earnings;

  @override
  void initState() {
    super.initState();
    _bootstrapRider();
  }

  Future<void> _bootstrapRider() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.post('/auth/dev-login', {'role': 'DELIVERY_PARTNER'});
      if (res['success'] == true && res['data']?['token'] != null) {
        ApiClient.setToken(res['data']['token']);
        await _fetchRiderData();
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchRiderData() async {
    try {
      final broadcastRes = await ApiClient.get('/delivery/broadcasts');
      final assignedRes = await ApiClient.get('/delivery/assigned');
      final earningsRes = await ApiClient.get('/delivery/earnings');

      if (mounted) {
        setState(() {
          _broadcasts = broadcastRes['data'] ?? [];
          _assignedOrders = assignedRes['data'] ?? [];
          _earnings = earningsRes['data'];
        });
      }
    } catch (_) {}
  }

  Future<void> _toggleShift(bool online) async {
    setState(() => _isOnline = online);
    try {
      await ApiClient.post('/delivery/shift', {
        'status': online ? 'ONLINE_IDLE' : 'OFFLINE',
      });
      if (online) {
        // Push initial location
        await ApiClient.post('/delivery/location', {
          'latitude': 26.1520,
          'longitude': 91.7760,
          'batteryPercentage': 88,
        });
      }
      await _fetchRiderData();
    } catch (_) {}
  }

  Future<void> _acceptOrder(String orderId) async {
    try {
      final res = await ApiClient.post('/delivery/orders/$orderId/accept', {});
      if (!mounted) return;
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order accepted! Head to restaurant.')),
        );
        await _fetchRiderData();
      }
    } catch (_) {}
  }

  Future<void> _confirmPickup(String orderId) async {
    try {
      final res = await ApiClient.post('/delivery/orders/$orderId/pickup', {});
      if (!mounted) return;
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order picked up! Deliver to customer.')),
        );
        await _fetchRiderData();
      }
    } catch (_) {}
  }

  Future<void> _confirmDelivery(String orderId) async {
    try {
      final res = await ApiClient.post('/delivery/orders/$orderId/deliver', {});
      if (!mounted) return;
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Delivery completed! Payment credited.')),
        );
        await _fetchRiderData();
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: Color(0xFF2563EB))),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.two_wheeler, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Bipul Bora (Rider)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
                ),
                Text('AS-01-ET-4021 • Kamrup Central', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              ],
            ),
          ],
        ),
        actions: [
          Row(
            children: [
              Text(
                _isOnline ? 'ONLINE' : 'OFFLINE',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: _isOnline ? const Color(0xFF15803D) : const Color(0xFF64748B),
                ),
              ),
              Switch(
                value: _isOnline,
                activeThumbColor: const Color(0xFF15803D),
                onChanged: _toggleShift,
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchRiderData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Rider Earnings Snapshot
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _earningStat('Today Payout', '₹${_earnings?['todayEarnings'] ?? 35}'),
                      _earningStat('This Week', '₹${_earnings?['weekEarnings'] ?? 245}'),
                      _earningStat('Completed', '${_earnings?['completedOrdersToday'] ?? 1} orders'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Active In-Flight Deliveries
            if (_assignedOrders.isNotEmpty) ...[
              const Text(
                'Active Assignment',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),
              ..._assignedOrders.map((ord) => _buildActiveOrderCard(ord)),
              const SizedBox(height: 20),
            ],

            // Available Delivery Broadcasts
            Text(
              'Broadcast Orders Nearby (${_broadcasts.length})',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 10),

            if (!_isOnline)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Column(
                    children: [
                      Icon(Icons.power_settings_new, size: 40, color: Color(0xFF94A3B8)),
                      SizedBox(height: 8),
                      Text(
                        'You are currently OFFLINE',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        'Go online to receive delivery requests and conserve battery when off duty.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              )
            else if (_broadcasts.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Center(
                  child: Column(
                    children: [
                      Icon(Icons.hourglass_empty, size: 36, color: Color(0xFF94A3B8)),
                      SizedBox(height: 8),
                      Text(
                        'Waiting for new kitchen orders...',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        'Orders will appear here as soon as restaurants mark them ready.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              )
            else
              ..._broadcasts.map((b) => _buildBroadcastCard(b)),
          ],
        ),
      ),
    );
  }

  Widget _earningStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
      ],
    );
  }

  Widget _buildActiveOrderCard(dynamic ord) {
    final status = ord['status'] as String;
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFF2563EB), width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  ord['orderNumber'],
                  style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace', fontSize: 15),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    status.replaceAll('_', ' '),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8)),
                  ),
                )
              ],
            ),
            const SizedBox(height: 10),
            const Text('Pickup: GS Road (Khorikaa Kitchen)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('Deliver: ${ord['deliveryAddress']?['addressLine1']}', style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
            const SizedBox(height: 12),
            Row(
              children: [
                if (status == 'RIDER_ASSIGNED')
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _confirmPickup(ord['id']),
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Confirm Pickup from Counter'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                if (status == 'PICKED_UP' || status == 'OUT_FOR_DELIVERY')
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _confirmDelivery(ord['id']),
                      icon: const Icon(Icons.done_all, size: 18),
                      label: const Text('Confirm Handover to Customer'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF15803D),
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBroadcastCard(dynamic b) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
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
                Text(b['orderNumber'], style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                Text('Payout: ₹${b['pricing']?['riderPayoutAmount'] ?? 35}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF15803D), fontSize: 14)),
              ],
            ),
            const SizedBox(height: 6),
            Text('Distance: ${b['deliveryDistanceKm']} km', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            Text('Customer Address: ${b['deliveryAddress']?['addressLine1']}', style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A))),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _acceptOrder(b['id']),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Accept Delivery Request', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
