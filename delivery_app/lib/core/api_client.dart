import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  // Production URLs
  static const String liveCustomDomain = 'https://aajori-cuisine.aajori.in/api/v1';
  static const String liveVercelDomain = 'https://aajori-cuisine-git-main-pallab-jyoti-gohains-projects.vercel.app/api/v1';
  static const String localDevUrl = 'http://10.0.2.2:4000/api/v1';

  // Default to live production URL
  static String baseUrl = const String.fromEnvironment('API_BASE_URL', defaultValue: liveCustomDomain);
  static String? authToken;

  static void setBaseUrl(String url) {
    baseUrl = url;
  }

  static void setToken(String token) {
    authToken = token;
  }

  static Map<String, String> _headers() {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authToken != null) {
      headers['Authorization'] = 'Bearer $authToken';
    }
    return headers;
  }

  static Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl$endpoint'), headers: _headers());
      return jsonDecode(response.body);
    } catch (e) {
      // If custom domain encounters network/SSL error, fallback to vercel domain
      if (baseUrl == liveCustomDomain) {
        final fallbackResponse = await http.get(Uri.parse('$liveVercelDomain$endpoint'), headers: _headers());
        return jsonDecode(fallbackResponse.body);
      }
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers(),
        body: jsonEncode(body),
      );
      return jsonDecode(response.body);
    } catch (e) {
      if (baseUrl == liveCustomDomain) {
        final fallbackResponse = await http.post(
          Uri.parse('$liveVercelDomain$endpoint'),
          headers: _headers(),
          body: jsonEncode(body),
        );
        return jsonDecode(fallbackResponse.body);
      }
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> patch(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers(),
        body: jsonEncode(body),
      );
      return jsonDecode(response.body);
    } catch (e) {
      if (baseUrl == liveCustomDomain) {
        final fallbackResponse = await http.patch(
          Uri.parse('$liveVercelDomain$endpoint'),
          headers: _headers(),
          body: jsonEncode(body),
        );
        return jsonDecode(fallbackResponse.body);
      }
      rethrow;
    }
  }
}
