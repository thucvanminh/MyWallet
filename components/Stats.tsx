import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions
} from 'react-native';
import { useWallet } from '../context/WalletContext';
import { TransactionType } from '../types';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { format } from 'date-fns';

type TimeRange = '1M' | '3M' | '6M' | '1Y';

export const Stats: React.FC = () => {
    const { transactions, categories } = useWallet();
    const [range, setRange] = useState<TimeRange>('1M');

    const screenWidth = Dimensions.get("window").width;

    const getStartDate = () => {
        const now = new Date();
        const d = new Date(now);
        switch (range) {
            case '1M': d.setMonth(d.getMonth() - 1); break;
            case '3M': d.setMonth(d.getMonth() - 3); break;
            case '6M': d.setMonth(d.getMonth() - 6); break;
            case '1Y': d.setFullYear(d.getFullYear() - 1); break;
            default: d.setMonth(d.getMonth() - 1);
        }
        return d;
    };

    const startDate = getStartDate();
    const filteredTx = transactions.filter(t => new Date(t.date) > startDate);

    // --- PIE CHART DATA ---
    const expenseDataMap: Record<string, number> = {};
    filteredTx.forEach(t => {
        const cat = categories.find(c => c.id === t.category_id);
        if (cat?.type === TransactionType.EXPENSE) {
            expenseDataMap[cat.name] = (expenseDataMap[cat.name] || 0) + t.amount;
        }
    });

    const pieData = Object.entries(expenseDataMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => {
            const cat = categories.find(c => c.name === name);
            return {
                name: name,
                population: value,
                color: cat?.color || '#94a3b8',
                legendFontColor: "#475569",
                legendFontSize: 12
            };
        });

    // --- BAR CHART DATA ---
    const barDataMap: Record<string, { income: number, expense: number }> = {};
    filteredTx.forEach(t => {
        const monthKey = format(new Date(t.date), 'MMM');
        if (!barDataMap[monthKey]) {
            barDataMap[monthKey] = { income: 0, expense: 0 };
        }
        const cat = categories.find(c => c.id === t.category_id);
        if (cat?.type === TransactionType.INCOME) {
            barDataMap[monthKey].income += t.amount;
        } else {
            barDataMap[monthKey].expense += t.amount;
        }
    });

    const barLabels = Object.keys(barDataMap).slice(-4);
    const barData = {
        labels: barLabels,
        datasets: [
            {
                data: barLabels.map(l => barDataMap[l].income),
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // emerald
            },
            {
                data: barLabels.map(l => barDataMap[l].expense),
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // rose
            }
        ],
        legend: ["Income", "Expense"]
    };

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    };

    const totalIncome = filteredTx.filter(t => categories.find(c => c.id === t.category_id)?.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const totalExpense = filteredTx.filter(t => categories.find(c => c.id === t.category_id)?.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Financial Stats</Text>

            {/* Range Filter */}
            <View style={styles.rangeTabs}>
                {(['1M', '3M', '6M', '1Y'] as TimeRange[]).map((r) => (
                    <TouchableOpacity
                        key={r}
                        onPress={() => setRange(r)}
                        style={[styles.rangeTab, range === r && styles.activeRangeTab]}
                    >
                        <Text style={[styles.rangeText, range === r && styles.activeRangeText]}>{r}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Overview Cards */}
            <View style={styles.row}>
                <View style={[styles.statCard, { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }]}>
                    <Text style={styles.statLabelIncome}>Total Income</Text>
                    <Text style={styles.statAmount}>${totalIncome.toLocaleString()}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fff1f2', borderColor: '#ffe4e6' }]}>
                    <Text style={styles.statLabelExpense}>Total Expense</Text>
                    <Text style={styles.statAmount}>${totalExpense.toLocaleString()}</Text>
                </View>
            </View>

            {/* Pie Chart */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Expenses Breakdown</Text>
                {pieData.length > 0 ? (
                    <PieChart
                        data={pieData}
                        width={screenWidth - 72}
                        height={200}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[10, 0]}
                        absolute
                    />
                ) : (
                    <View style={styles.emptyChart}><Text style={styles.emptyText}>No data for this range</Text></View>
                )}
            </View>

            {/* Bar Chart */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Income vs Expense</Text>
                {barLabels.length > 0 ? (
                    <BarChart
                        data={barData}
                        width={screenWidth - 40}
                        height={220}
                        yAxisLabel="$"
                        chartConfig={chartConfig}
                        verticalLabelRotation={0}
                        fromZero
                        showBarTops={false}
                        flatColor={true}
                        style={styles.barChart}
                        yAxisSuffix=""
                    />
                ) : (
                    <View style={styles.emptyChart}><Text style={styles.emptyText}>No data for this range</Text></View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        gap: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    rangeTabs: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        padding: 4,
        borderRadius: 10,
    },
    rangeTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeRangeTab: {
        backgroundColor: '#ffffff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    rangeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    activeRangeText: {
        color: '#4f46e5',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    statLabelIncome: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statLabelExpense: {
        fontSize: 10,
        fontWeight: '700',
        color: '#e11d48',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    card: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 16,
    },
    emptyChart: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    barChart: {
        marginVertical: 8,
        borderRadius: 16,
    },
});
