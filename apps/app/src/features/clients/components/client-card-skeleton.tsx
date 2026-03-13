import { SkeletonBox } from "@/components/ui/skeleton-box";
import { View } from "react-native";

export function ClientCardSkeleton() {
  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4">
      <SkeletonBox style={{ width: 48, height: 48, borderRadius: 24 }} />
      <View className="flex-1">
        <SkeletonBox style={{ height: 16, width: 160 }} />
        <SkeletonBox style={{ marginTop: 8, height: 12, width: 112 }} />
        <SkeletonBox style={{ marginTop: 8, height: 12, width: 80 }} />
      </View>
      <View className="flex-row gap-2">
        <SkeletonBox style={{ width: 32, height: 32, borderRadius: 16 }} />
        <SkeletonBox style={{ width: 32, height: 32, borderRadius: 16 }} />
      </View>
    </View>
  );
}
