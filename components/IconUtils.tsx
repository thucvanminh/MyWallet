import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
    Utensils, Car, ShoppingBag, Film, Zap, Briefcase, Laptop, TrendingUp,
    Home, Gift, Coffee, Smartphone, Wifi, CreditCard, DollarSign, Heart, Tag
} from 'lucide-react-native';

export const ICON_MAP: Record<string, React.ElementType> = {
    Utensils, Car, ShoppingBag, Film, Zap, Briefcase, Laptop, TrendingUp,
    Home, Gift, Coffee, Smartphone, Wifi, CreditCard, DollarSign, Heart, Tag
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface IconByNameProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
}

export const IconByName: React.FC<IconByNameProps> = ({ name, size = 20, color = "#64748b", style }) => {
    const IconComponent = ICON_MAP[name] || Tag;
    return <IconComponent size={size} color={color} style={style} />;
};

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
    return (
        <View style={styles.grid}>
            {AVAILABLE_ICONS.map((iconName) => (
                <TouchableOpacity
                    key={iconName}
                    onPress={() => onSelect(iconName)}
                    style={[
                        styles.iconButton,
                        selectedIcon === iconName ? styles.selectedIconButton : styles.unselectedIconButton
                    ]}
                >
                    <IconByName
                        name={iconName}
                        size={20}
                        color={selectedIcon === iconName ? "#ffffff" : "#64748b"}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedIconButton: {
        backgroundColor: '#4f46e5',
    },
    unselectedIconButton: {
        backgroundColor: '#f1f5f9',
    },
});
