import { Text, View } from "react-native";
import { getCategoryByKey } from "../../constants/categories";
import { useI18n } from "../../contexts/I18nContext";
import { CategoryBadgeProps } from "./types";

export function CategoryBadge(props: CategoryBadgeProps) {
    const { categoryKey } = props;
    const { t } = useI18n();

    const cat = getCategoryByKey(categoryKey);
    return (
        <View
            style={{
                backgroundColor: cat.color + "20",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: cat.color + "28",
                alignSelf: "flex-start",
            }}
        >
            <Text style={{ color: cat.color, fontSize: 11, fontWeight: "700" }}>
                {t(cat.labelKey)}
            </Text>
        </View>
    );
}
