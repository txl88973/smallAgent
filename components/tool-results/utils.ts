export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatCurrency = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return `¥${amount.toFixed(2)}`;
};

export const priorityLabel = (priority?: string | null) => {
  switch (priority) {
    case "low":
      return "低";
    case "normal":
      return "普通";
    case "high":
      return "高";
    default:
      return priority ?? "-";
  }
};

export const stringifyJson = (value: unknown) => JSON.stringify(value, null, 2);
