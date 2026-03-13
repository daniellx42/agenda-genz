import { SkeletonBox } from "@/components/ui/skeleton-box";
import { View } from "react-native";

export function AppointmentCardSkeleton() {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-rose-100 bg-white">
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row items-center gap-3">
            <SkeletonBox style={{ width: 48, height: 48, borderRadius: 18 }} />
            <View className="flex-1">
              <SkeletonBox style={{ height: 16, width: "55%" }} />
              <SkeletonBox style={{ marginTop: 8, height: 12, width: "42%" }} />
              <SkeletonBox style={{ marginTop: 10, height: 12, width: "48%" }} />
            </View>
          </View>
          <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
        </View>
      </View>

      <View className="border-t border-rose-100 px-4 py-3">
        <View className="flex-row flex-wrap gap-2">
          <SkeletonBox style={{ height: 12, width: 72 }} />
          <SkeletonBox style={{ height: 12, width: 88 }} />
          <SkeletonBox style={{ height: 12, width: 96 }} />
        </View>

        <View className="mt-3 flex-row gap-2">
          <SkeletonBox style={{ height: 40, flex: 1, borderRadius: 14 }} />
          <SkeletonBox style={{ height: 40, flex: 1, borderRadius: 14 }} />
        </View>
      </View>
    </View>
  );
}
