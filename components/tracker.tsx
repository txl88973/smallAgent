"use client";

import { BoxIcon, GPSIcon, HomeIcon, InvoiceIcon } from "./icons";
import { motion } from "framer-motion";

type TrackingInformation = {
  orderId?: string;
  orderNo?: string;
  progress?: string;
  description?: string;
  carrier?: string;
  trackingNo?: string;
  currentStatus?: string;
  steps?: unknown[];
};

const isInTransit = (progress: string) =>
  progress === "Out for Delivery" || progress === "运输中";

const isWaiting = (progress: string) =>
  progress === "Shipped" || progress === "待发货";

const isDelivered = (progress: string) =>
  progress === "Delivered" || progress === "已签收";

const getColorFromProgress = ({
  progress,
  type,
}: {
  progress: string;
  type: "foreground" | "text";
}) => {
  switch (progress) {
    case "Shipped":
      return type === "foreground" ? "#a1a1aa" : "#fafafa";
    case "Out for Delivery":
    case "运输中":
      return type === "foreground" ? "#3b82f6" : "#eff6ff";
    case "Delivered":
    case "已签收":
      return type === "foreground" ? "#10b981" : "#f0fdf4";
    case "待发货":
      return type === "foreground" ? "#f59e0b" : "#fffbeb";
    default:
      return type === "foreground" ? "#f4f4f5" : "#71717a";
  }
};

export const Tracker = ({
  trackingInformation,
}: {
  trackingInformation: TrackingInformation;
}) => {
  const progress =
    trackingInformation.currentStatus ?? trackingInformation.progress ?? "未知";
  const orderId = trackingInformation.orderNo ?? trackingInformation.orderId;
  const description =
    trackingInformation.description ??
    [trackingInformation.carrier, trackingInformation.trackingNo]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="my-4 flex flex-col gap-6 md:max-w-[452px] max-w-[calc(100dvw-80px)] w-full justify-between">
      <motion.div
        className="flex flex-col justify-between items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.0 }}
      >
        <div className="flex flex-row gap-2 items-center text-sm text-zinc-500 dark:text-zinc-400">
          <div>Tracking Order</div>
          <InvoiceIcon size={14} />
          <div>{orderId}</div>
        </div>
      </motion.div>

      <motion.div
        className="flex flex-row items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div
          className="size-8 text-blue-50 rounded-full flex-shrink-0 flex flex-row justify-center items-center"
          initial={{ background: "#f4f4f5" }}
          animate={{
            background: getColorFromProgress({
              progress,
              type: "foreground",
            }),
            color: getColorFromProgress({
              progress,
              type: "text",
            }),
          }}
          transition={{ delay: 0.2 }}
        >
          <BoxIcon size={14} />
        </motion.div>
        <div className="h-2 bg-zinc-100 w-full rounded-lg relative dark:bg-zinc-700">
          <motion.div
            className="h-2 rounded-lg z-10 absolute"
            initial={{ width: 0, background: "#f4f4f5" }}
            animate={{
              width: isDelivered(progress)
                ? "100%"
                : isInTransit(progress)
                  ? "100%"
                  : isWaiting(progress)
                    ? "34%"
                    : "0%",
              background: getColorFromProgress({
                progress,
                type: "foreground",
              }),
            }}
            transition={{ delay: 0.3 }}
          />
        </div>

        <motion.div
          className="size-8 text-blue-50 rounded-full flex-shrink-0 flex flex-row justify-center items-center"
          initial={{ background: "#f4f4f5" }}
          animate={{
            background: isWaiting(progress)
              ? "#f4f4f5"
              : getColorFromProgress({
                  progress,
                  type: "foreground",
                }),
            color: isWaiting(progress)
              ? "#71717a"
              : getColorFromProgress({
                  progress,
                  type: "text",
                }),
          }}
          transition={{ delay: 0.4 }}
        >
          <span style={{ transform: "translateX(-1.25px) translateY(1px)" }}>
            <GPSIcon size={14} />
          </span>
        </motion.div>

        <div className="h-2 bg-zinc-100 w-full rounded-lg relative dark:bg-zinc-700">
          <motion.div
            className="h-2 rounded-lg z-10 absolute"
            initial={{ width: 0, background: "#f4f4f5" }}
            animate={{
              width: isDelivered(progress)
                ? "100%"
                : isInTransit(progress)
                  ? "71%"
                  : "0%",
              background: getColorFromProgress({
                progress,
                type: "foreground",
              }),
            }}
            transition={{ delay: 0.5 }}
          />
        </div>
        <motion.div
          className="size-8 bg-zinc-100 text-zinc-500 dark:text-zinc-400 rounded-full flex-shrink-0 flex flex-row justify-center items-center"
          initial={{
            background: "#f4f4f5",
            color: "#71717a",
          }}
          transition={{ delay: 0.5 }}
          animate={{
            background:
              isInTransit(progress) || isWaiting(progress)
                ? "#f4f4f5"
                : getColorFromProgress({
                    progress,
                    type: "foreground",
                  }),
            color:
              isInTransit(progress) || isWaiting(progress)
                ? "#71717a"
                : getColorFromProgress({
                    progress,
                    type: "text",
                  }),
          }}
        >
          <HomeIcon size={14} />
        </motion.div>
      </motion.div>

      <motion.div
        className="flex flex-col justify-between items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="text-sm">{progress}</div>
        {description && (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </div>
        )}
      </motion.div>
    </div>
  );
};
