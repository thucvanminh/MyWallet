import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { WalletProvider, useWallet } from './context/WalletContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Stats } from './components/Stats';
import { ViewState } from './types';
import { LayoutDashboard, List, PieChart, LogOut } from 'lucide-react-native';

const AppContent: React.FC = () => {
    const { user, signOut, isLoading } = useWallet();
    const [view, setView] = useState<ViewState>('dashboard');

    if (!user && !isLoading) {
        return <Auth />;
    }

    if (isLoading && !user) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.main}>
                {view === 'dashboard' && <Dashboard />}
                {view === 'transactions' && <Transactions />}
                {view === 'stats' && <Stats />}
            </View>

            {/* Bottom Navigation */}
            <View style={styles.nav}>
                <TouchableOpacity
                    onPress={() => setView('dashboard')}
                    style={styles.navItem}
                >
                    <LayoutDashboard size={24} color={view === 'dashboard' ? '#4f46e5' : '#94a3b8'} />
                    <Text style={[styles.navText, view === 'dashboard' && styles.navTextActive]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setView('transactions')}
                    style={styles.navItem}
                >
                    <List size={24} color={view === 'transactions' ? '#4f46e5' : '#94a3b8'} />
                    <Text style={[styles.navText, view === 'transactions' && styles.navTextActive]}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setView('stats')}
                    style={styles.navItem}
                >
                    <PieChart size={24} color={view === 'stats' ? '#4f46e5' : '#94a3b8'} />
                    <Text style={[styles.navText, view === 'stats' && styles.navTextActive]}>Stats</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={signOut}
                    style={styles.navItem}
                >
                    <LogOut size={24} color="#94a3b8" />
                    <Text style={styles.navText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const App: React.FC = () => {
    return (
        <WalletProvider>
            <AppContent />
        </WalletProvider>
    );
};

export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    main: {
        flex: 1,
    },
    nav: {
        flexDirection: 'row',
        height: 64,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 4,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#94a3b8',
    },
    navTextActive: {
        color: '#4f46e5',
    },
});
