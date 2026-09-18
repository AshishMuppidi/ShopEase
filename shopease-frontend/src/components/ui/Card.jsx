/**
 * Simple surface container. `padded` adds default inner spacing; set to false
 * when the card holds edge-to-edge content like an image or a table.
 */
export default function Card({
  children,
  padded = true,
  className = '',
  ...rest
}) {
  return (
    <div
      className={`card-base ${padded ? 'p-5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
