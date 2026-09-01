/**
 * Serializa uma data como "yyyy-MM-ddTHH:mm:ss", sem indicador de fuso (sem "Z").
 *
 * Por quê: `date.toISOString()` sempre converte pra UTC, e ao reconstruir com
 * `new Date(string)` no servidor o resultado depende do fuso horário do
 * processo — pra um produto local de fuso único (Vila Velha-ES), isso pode
 * deslocar o horário. Uma string sem "Z" é interpretada como hora local tanto
 * no navegador quanto no servidor, então o mesmo texto representa o mesmo
 * horário de parede nos dois lados — desde que o servidor rode com
 * TZ=America/Sao_Paulo (ver README).
 */
export function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
