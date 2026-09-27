/** Faqat sayt ichidagi manzillarga qaytaramiz (open redirect'dan himoya). */
export function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
