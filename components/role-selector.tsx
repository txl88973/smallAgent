"use client";

export type Role = "admin" | "user";

type RoleSelectorProps = {
  role: Role;
  onRoleChange: (role: Role) => void;
};

const roles: Array<{
  value: Role;
  label: string;
  description: string;
}> = [
  {
    value: "user",
    label: "User",
    description: "只能查看查询类 Skill",
  },
  {
    value: "admin",
    label: "Admin",
    description: "可查看所有工具说明",
  },
];

export const RoleSelector = ({ role, onRoleChange }: RoleSelectorProps) => {
  return (
    <section className="flex flex-col gap-3 border border-zinc-200 rounded-lg p-4 dark:border-zinc-800">
      <div>
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Role
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          切换角色查看 Skill 权限
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {roles.map((item) => {
          const isSelected = item.value === role;

          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onRoleChange(item.value)}
              className={`rounded-md border px-3 py-2 text-left transition-colors ${
                isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="block text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {roles.find((item) => item.value === role)?.description}
      </p>
    </section>
  );
};
