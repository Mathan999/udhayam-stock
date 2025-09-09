import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { ref, onValue, off } from 'firebase/database';
import { database } from './firebase';
import { Download, RefreshCw, Search, Filter, Smartphone, AlertCircle, Loader2, Package, Bell, X, CheckCircle, Info } from 'lucide-react';

const CustomerOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installing, setInstalling] = useState(false);
  
  // New notification states
  const [notifications, setNotifications] = useState([]);
  const [, setUnreadNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);

  // Check if installed
  useEffect(() => {
    if (localStorage.getItem('pwaInstalled') === 'true') {
      setIsInstalled(true);
    }
  }, []);

  // Load notifications from Firebase
  useEffect(() => {
    const notificationsRef = ref(database, 'notifications');
    const handleNotificationData = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedNotifications = Object.entries(data)
          .map(([key, value]) => ({
            id: key,
            ...value
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setNotifications(loadedNotifications);
        const unreadCount = loadedNotifications.filter(n => !n.read).length;
        setNotificationCount(unreadCount);
        setUnreadNotifications(loadedNotifications.filter(n => !n.read));

        // Show real-time notification for new orders
        const latestNotification = loadedNotifications[0];
        if (latestNotification && !latestNotification.read && latestNotification.type === 'new_order') {
          showRealtimeNotification(latestNotification);
        }
      }
    };

    onValue(notificationsRef, handleNotificationData);
    return () => off(notificationsRef);
  }, []);

  // Real-time notification display
  const showRealtimeNotification = (notification) => {
    const id = Date.now();
    const realtimeNotif = {
      id,
      ...notification,
      showTime: new Date().toLocaleTimeString()
    };

    setRealtimeNotifications(prev => [...prev, realtimeNotif]);

    // Play notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBj2c4+67eCMFLIjP8+WXQQoXY7Tl4axYEgtFpeCzwmwhBj2c6+m9fyMFLIvH8+KVQgoZY7bn7aJRFQhLqeC2ymghBj+a2+DFeCMFKojO8+GVQgoaYrTh27JjFwlBmePxtmYdBTiN2+3BeSkFKIHI9N+UQQsVW7PvybRdGAg+j+Pp1W0gCTyo4++GQAoCdsvtxqtkHgU9mO/ltUwgCDyV4++JRA0EdcrvxqliHAU8l+rtuEslBzqR5+yHRAoEdcnug65lHwU+leJ9gUQNB4jH8+aUP');
      audio.play().catch(() => {});
    } catch (error) {
      console.log('Audio notification failed:', error);
    }

    // Auto remove after 8 seconds
    setTimeout(() => {
      setRealtimeNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  // Remove realtime notification manually
  const removeRealtimeNotification = (id) => {
    setRealtimeNotifications(prev => prev.filter(n => n.id !== id));
  };

  // PWA events
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA install prompt ready');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log('App installed');
      localStorage.setItem('pwaInstalled', 'true');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstalling(false);
      alert('APK installed! Check your home screen.');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install handler with "APK download" simulation
  const handleInstallClick = async () => {
    setInstalling(true);
    if (deferredPrompt) {
      console.log('Triggering PWA install (WebAPK)');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setTimeout(() => {
          localStorage.setItem('pwaInstalled', 'true');
          setIsInstalled(true);
          setDeferredPrompt(null);
          setInstalling(false);
          alert('Installation complete! App added to home screen like APK.');
        }, 3000); // 3 sec "download" delay for feel
      } else {
        setInstalling(false);
      }
    } else {
      // Fallback to guide for real APK
      setTimeout(() => {
        setInstalling(false);
        setShowInstallGuide(true);
      }, 2000);
    }
  };

  const hideInstallGuide = () => {
    setShowInstallGuide(false);
  };

  // Firebase orders (unchanged)
  useEffect(() => {
    const customerOrdersRef = ref(database, 'customerOrders');
    const handleOrderData = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedOrders = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setOrders(loadedOrders);
      } else {
        setOrders([]);
      }
      setLoading(false);
    };
    onValue(customerOrdersRef, handleOrderData, (error) => {
      console.error("Error:", error);
      setOrders([]);
      setLoading(false);
    });
    return () => off(customerOrdersRef);
  }, []);

  // Listen for stock updates (new feature)
  useEffect(() => {
    const stockRef = ref(database, 'stock');
    const handleStockData = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const stockEntries = Object.entries(data);
        const latestStock = stockEntries[stockEntries.length - 1];
        
        if (latestStock && latestStock[1].stockUpdate) {
          const stockUpdate = latestStock[1].stockUpdate;
          // Show notification for stock update
          const stockNotification = {
            id: Date.now(),
            type: 'stock_update',
            title: `Stock Updated - Order #${stockUpdate.orderTokenNumber}`,
            message: `Items: ${stockUpdate.items.length}, Value: ₹${stockUpdate.totalOrderValue}`,
            timestamp: stockUpdate.updatedAt,
            orderData: stockUpdate
          };
          
          showRealtimeNotification(stockNotification);
        }
      }
    };

    onValue(stockRef, handleStockData);
    return () => off(stockRef);
  }, []);

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone?.includes(searchTerm) ||
        order.tokenNumber?.toString().includes(searchTerm) ||
        order.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.orderDate) - new Date(a.orderDate);
        case 'oldest': return new Date(a.orderDate) - new Date(b.orderDate);
        case 'tokenAsc': return a.tokenNumber - b.tokenNumber;
        case 'tokenDesc': return b.tokenNumber - a.tokenNumber;
        case 'amountAsc': return a.totalAmount - b.totalAmount;
        case 'amountDesc': return b.totalAmount - a.totalAmount;
        default: return 0;
      }
    });

  const downloadPDF = (order) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.text("MAHITHRAA SRI CRACKERS", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("Vanamoorthilingapuram,", 105, 30, { align: "center" });
    doc.text("Madathupatti, Sivakasi - 626123", 105, 35, { align: "center" });
    doc.text("Phone no.: +919080533427 & +918110087349", 105, 40, { align: "center" });
    doc.setFontSize(14);
    doc.text("Customer Order Details", 20, 55);
    doc.setFontSize(10);
    doc.text(`Token No.: ${order.tokenNumber || 'N/A'}`, 20, 70);
    doc.text(`Invoice No.: ${order.invoiceNumber || 'N/A'}`, 20, 75);
    doc.text(`Order Date: ${order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'N/A'}`, 20, 80);
    doc.text(`Status: ${order.status || 'N/A'}`, 20, 85);
    doc.text(`PDF Downloaded: ${order.pdfDownloaded ? 'Yes' : 'No'}`, 20, 90);
    doc.text("Customer Details:", 20, 105);
    doc.text(`Name: ${order.customer || 'N/A'}`, 20, 110);
    doc.text(`Phone: ${order.phone || 'N/A'}`, 20, 115);
    doc.text(`Address: ${order.address || 'N/A'}`, 20, 120);
    doc.text(`City: ${order.city || 'N/A'}`, 20, 125);
    let yPos = 140;
    doc.text("Order Items:", 20, yPos);
    yPos += 10;
    if (order.cart && order.cart.length > 0) {
      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPos, 190, 8, "F");
      doc.text("Item", 12, yPos + 5);
      doc.text("Qty", 120, yPos + 5);
      doc.text("Price", 140, yPos + 5);
      doc.text("Total", 170, yPos + 5);
      yPos += 10;
      order.cart.forEach((item) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        const itemName = item.productName?.length > 40 ? item.productName.substring(0, 40) + "..." : item.productName || 'N/A';
        doc.text(itemName, 12, yPos + 5);
        doc.text((item.quantity || 0).toString(), 122, yPos + 5);
        doc.text(`₹${(item.ourPrice || 0).toFixed(2)}`, 142, yPos + 5);
        doc.text(`₹${((item.ourPrice || 0) * (item.quantity || 0)).toFixed(2)}`, 172, yPos + 5);
        yPos += 8;
      });
    } else {
      doc.text("No items in cart", 20, yPos + 5);
      yPos += 10;
    }
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: ₹${(order.totalAmount || 0).toFixed(2)}`, 20, yPos);
    const fileName = `customer_order_token_${order.tokenNumber}_${order.customer || 'unknown'}.pdf`;
    doc.save(fileName);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const refreshOrders = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order': return <Package size={20} className="text-green-600" />;
      case 'stock_update': return <Info size={20} className="text-blue-600" />;
      default: return <Bell size={20} className="text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_order': return 'bg-green-50 border-green-200 text-green-800';
      case 'stock_update': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600 text-lg">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Real-time notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {realtimeNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-500 animate-slide-in ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    <p className="text-xs mt-1">{notification.message}</p>
                    <p className="text-xs opacity-70 mt-1">{notification.showTime}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeRealtimeNotification(notification.id)}
                  className="opacity-70 hover:opacity-100 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              Customer Orders
              {notificationCount > 0 && (
                <span className="ml-3 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
                  {notificationCount}
                </span>
              )}
            </h2>
            <p className="text-gray-600 mt-1">Total Orders: {filteredOrders.length} | Showing: {filteredOrders.length} results</p>
          </div>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center relative"
            >
              <Bell size={16} className="mr-2" />
              Notifications
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <button onClick={refreshOrders} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className={`px-4 py-2 rounded-lg flex items-center transition ${
                  installing ? 'bg-green-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {installing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Downloading APK...
                  </>
                ) : (
                  <>
                    <Package size={16} className="mr-2" />
                    Install APK
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Notification Panel */}
        {showNotifications && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notifications yet</p>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${notification.read ? 'bg-gray-50' : getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                        {notification.orderData && (
                          <div className="mt-2 text-xs text-gray-600">
                            <span>Token: {notification.orderData.tokenNumber}</span>
                            <span className="mx-2">|</span>
                            <span>Customer: {notification.orderData.customerName}</span>
                            <span className="mx-2">|</span>
                            <span>Amount: ₹{notification.orderData.totalAmount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Guide Modal for Real APK */}
        {showInstallGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Get Real APK</h3>
                <button onClick={hideInstallGuide} className="text-gray-500">
                  <AlertCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600 mb-4">For APK download, use PWABuilder:</p>
              <a
                href="https://www.pwabuilder.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-blue-600 text-white rounded text-center mb-4"
              >
                Generate APK Now
              </a>
              <p className="text-sm text-gray-500">Enter your site URL there to build APK.</p>
              <div className="flex justify-end mt-4">
                <button onClick={hideInstallGuide} className="px-4 py-2 bg-gray-300 rounded">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, phone, token, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="tokenDesc">Token No. (High to Low)</option>
                <option value="tokenAsc">Token No. (Low to High)</option>
                <option value="amountDesc">Amount (High to Low)</option>
                <option value="amountAsc">Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 text-lg">No orders found.</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-800 text-white">
                  <tr>
                    <th className="p-4 font-medium">Token No.</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Phone</th>
                    <th className="p-4 font-medium">City</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">PDF Status</th>
                    <th className="p-4 font-medium">Order Date</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-blue-600">#{order.tokenNumber || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Invoice: {order.invoiceNumber || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{order.customer || 'N/A'}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{order.address || 'No address'}</div>
                      </td>
                      <td className="p-4 text-gray-700">{order.phone || 'N/A'}</td>
                      <td className="p-4 text-gray-700">{order.city || 'N/A'}</td>
                      <td className="p-4">
                        <div className="font-medium text-green-600">₹{(order.totalAmount || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Items: {order.cart ? order.cart.length : 0}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.pdfDownloaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {order.pdfDownloaded ? 'Downloaded' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700">
                        <div>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'N/A'}</div>
                        <div className="text-xs text-gray-500">{order.orderDate ? new Date(order.orderDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </td>
                      <td className="p-4">
                        <button onClick={() => downloadPDF(order)} className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm">
                          <Download size={14} className="mr-1" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-green-600">₹{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-yellow-600">{orders.filter(order => order.status === 'Pending').length}</div>
              <div className="text-sm text-gray-600">Pending Orders</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-purple-600">{orders.filter(order => order.pdfDownloaded).length}</div>
              <div className="text-sm text-gray-600">PDFs Downloaded</div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CustomerOrder;