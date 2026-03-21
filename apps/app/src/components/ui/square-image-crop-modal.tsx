import type { SquareImageCropRect } from "@/lib/media/square-image";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { ImagePickerAsset } from "expo-image-picker";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface SquareImageCropModalProps {
  visible: boolean;
  asset: ImagePickerAsset | null;
  title?: string;
  description?: string;
  confirmLabel?: string;
  processing?: boolean;
  onCancel: () => void;
  onConfirm: (crop: SquareImageCropRect) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DEFAULT_TITLE = "Ajustar imagem";
const DEFAULT_DESCRIPTION =
  "Arraste a foto e aproxime com os dedos para encaixar direitinho.";
const DEFAULT_CONFIRM_LABEL = "Usar imagem";

function clampValue(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

function getMaxTranslation(
  baseSize: number,
  cropSize: number,
  scale: number,
) {
  "worklet";
  return Math.max(0, (baseSize * scale - cropSize) / 2);
}

function getSafeDimension(value: number | undefined, fallback: number) {
  return value && value > 0 ? value : fallback;
}

export function SquareImageCropModal({
  visible,
  asset,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  confirmLabel = DEFAULT_CONFIRM_LABEL,
  processing = false,
  onCancel,
  onConfirm,
}: SquareImageCropModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const cropSize = useMemo(() => {
    const horizontalLimit = Math.max(220, Math.min(windowWidth - 32, 360));
    const verticalLimit = Math.max(
      220,
      windowHeight - insets.top - insets.bottom - 300,
    );

    return Math.max(220, Math.min(horizontalLimit, verticalLimit));
  }, [insets.bottom, insets.top, windowHeight, windowWidth]);

  const assetWidth = getSafeDimension(asset?.width, cropSize);
  const assetHeight = getSafeDimension(asset?.height, cropSize);
  const baseScale = Math.max(cropSize / assetWidth, cropSize / assetHeight);
  const baseImageWidth = assetWidth * baseScale;
  const baseImageHeight = assetHeight * baseScale;

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);

  useEffect(() => {
    if (!visible || !asset) return;

    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
  }, [asset, cropSize, scale, translateX, translateY, visible]);

  const panGesture = Gesture.Pan()
    .enabled(Boolean(asset) && !processing)
    .onStart(() => {
      panStartX.value = translateX.value;
      panStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const maxX = getMaxTranslation(baseImageWidth, cropSize, scale.value);
      const maxY = getMaxTranslation(baseImageHeight, cropSize, scale.value);

      translateX.value = clampValue(
        panStartX.value + event.translationX,
        -maxX,
        maxX,
      );
      translateY.value = clampValue(
        panStartY.value + event.translationY,
        -maxY,
        maxY,
      );
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(Boolean(asset) && !processing)
    .onStart(() => {
      pinchStartScale.value = scale.value;
    })
    .onUpdate((event) => {
      const nextScale = clampValue(
        pinchStartScale.value * event.scale,
        MIN_SCALE,
        MAX_SCALE,
      );
      const maxX = getMaxTranslation(baseImageWidth, cropSize, nextScale);
      const maxY = getMaxTranslation(baseImageHeight, cropSize, nextScale);

      scale.value = nextScale;
      translateX.value = clampValue(translateX.value, -maxX, maxX);
      translateY.value = clampValue(translateY.value, -maxY, maxY);
    });

  const imageGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const applyScaleStep = (delta: number) => {
    const nextScale = clampValue(scale.value + delta, MIN_SCALE, MAX_SCALE);
    const maxX = getMaxTranslation(baseImageWidth, cropSize, nextScale);
    const maxY = getMaxTranslation(baseImageHeight, cropSize, nextScale);

    scale.value = withTiming(nextScale, { duration: 160 });
    translateX.value = withTiming(
      clampValue(translateX.value, -maxX, maxX),
      { duration: 160 },
    );
    translateY.value = withTiming(
      clampValue(translateY.value, -maxY, maxY),
      { duration: 160 },
    );
  };

  const resetImage = () => {
    scale.value = withTiming(1, { duration: 160 });
    translateX.value = withTiming(0, { duration: 160 });
    translateY.value = withTiming(0, { duration: 160 });
  };

  const handleConfirm = () => {
    if (!asset) return;

    const currentScale = scale.value;
    const currentTranslateX = translateX.value;
    const currentTranslateY = translateY.value;
    const renderedWidth = baseImageWidth * currentScale;
    const renderedHeight = baseImageHeight * currentScale;
    const visibleOriginX =
      (renderedWidth - cropSize) / 2 - currentTranslateX;
    const visibleOriginY =
      (renderedHeight - cropSize) / 2 - currentTranslateY;
    const cropWidth = (cropSize / renderedWidth) * assetWidth;
    const cropHeight = (cropSize / renderedHeight) * assetHeight;

    onConfirm({
      originX: (visibleOriginX / renderedWidth) * assetWidth,
      originY: (visibleOriginY / renderedHeight) * assetHeight,
      width: cropWidth,
      height: cropHeight,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={processing ? undefined : onCancel}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(17, 8, 14, 0.96)" }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View className="flex-1 px-4 pb-4 pt-2">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <View className="self-start rounded-full border border-rose-300/20 bg-rose-500/15 px-3 py-1">
                    <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-rose-100">
                      Corte 1:1
                    </Text>
                  </View>
                  <Text className="mt-3 text-2xl font-bold text-white">
                    {title}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-rose-50/80">
                    {description}
                  </Text>
                </View>

                <Pressable
                  onPress={onCancel}
                  disabled={processing}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar corte de imagem"
                  className="h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 active:opacity-80"
                  style={{ opacity: processing ? 0.5 : 1 }}
                >
                  <Feather name="x" size={20} color="white" />
                </Pressable>
              </View>

              <View className="flex-1 items-center justify-center">
                <View
                  className="items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-black"
                  style={{ width: cropSize, height: cropSize }}
                >
                  {asset ? (
                    <GestureDetector gesture={imageGesture}>
                      <View
                        collapsable={false}
                        className="flex-1 items-center justify-center"
                      >
                        <Animated.View
                          style={[
                            {
                              width: baseImageWidth,
                              height: baseImageHeight,
                            },
                            imageStyle,
                          ]}
                        >
                          <Image
                            source={{ uri: asset.uri }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="fill"
                          />
                        </Animated.View>
                      </View>
                    </GestureDetector>
                  ) : null}

                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 32,
                      borderWidth: 1.5,
                      borderColor: "rgba(255,255,255,0.65)",
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      width: 26,
                      height: 26,
                      borderTopWidth: 3,
                      borderLeftWidth: 3,
                      borderColor: "#fb7185",
                      borderTopLeftRadius: 18,
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 26,
                      height: 26,
                      borderTopWidth: 3,
                      borderRightWidth: 3,
                      borderColor: "#fb7185",
                      borderTopRightRadius: 18,
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      bottom: 16,
                      left: 16,
                      width: 26,
                      height: 26,
                      borderBottomWidth: 3,
                      borderLeftWidth: 3,
                      borderColor: "#fb7185",
                      borderBottomLeftRadius: 18,
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      bottom: 16,
                      right: 16,
                      width: 26,
                      height: 26,
                      borderBottomWidth: 3,
                      borderRightWidth: 3,
                      borderColor: "#fb7185",
                      borderBottomRightRadius: 18,
                    }}
                  />
                </View>

                <Text className="mt-4 text-center text-sm leading-6 text-rose-50/75">
                  O que aparecer dentro do quadro sera enviado para o app.
                </Text>

                <View className="mt-5 flex-row gap-3">
                  <Pressable
                    onPress={() => applyScaleStep(-0.35)}
                    disabled={processing}
                    className="h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 active:opacity-80"
                    style={{ opacity: processing ? 0.5 : 1 }}
                  >
                    <Feather name="minus" size={18} color="white" />
                  </Pressable>

                  <Pressable
                    onPress={resetImage}
                    disabled={processing}
                    className="items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 active:opacity-80"
                    style={{ opacity: processing ? 0.5 : 1 }}
                  >
                    <Text className="text-sm font-semibold text-white">
                      Centralizar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => applyScaleStep(0.35)}
                    disabled={processing}
                    className="h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 active:opacity-80"
                    style={{ opacity: processing ? 0.5 : 1 }}
                  >
                    <Feather name="plus" size={18} color="white" />
                  </Pressable>
                </View>
              </View>

              <View className="rounded-[28px] border border-rose-200/10 bg-white px-4 py-4">
                <View className="mb-4 flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
                    <Feather name="move" size={18} color="#f43f5e" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-zinc-900">
                      Ajuste do seu jeito
                    </Text>
                    <Text className="mt-1 text-xs leading-5 text-zinc-500">
                      Arraste a foto, use pinca para aproximar ou toque nos botoes
                      para ajustar com mais precisao.
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={onCancel}
                    disabled={processing}
                    className="flex-1 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
                    style={{ opacity: processing ? 0.5 : 1 }}
                  >
                    <Text className="text-sm font-semibold text-zinc-700">
                      Cancelar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirm}
                    disabled={!asset || processing}
                    className="flex-1 items-center rounded-2xl bg-rose-500 py-3.5 active:opacity-80"
                    style={{ opacity: !asset || processing ? 0.7 : 1 }}
                  >
                    {processing ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-sm font-bold text-white">
                        {confirmLabel}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
