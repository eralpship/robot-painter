interface AddElementToolbarProps {
  onAddText: () => void
  onAddImage: (base64: string) => void
}

export const AddElementToolbar: React.FC<AddElementToolbarProps> = ({
  onAddText,
  onAddImage,
}) => {
  return (
    <>
      <button
        onClick={onAddText}
        style={{
          cursor: 'pointer',
        }}
      >
        add text
      </button>
      <button
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = e => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = () => {
                const base64 = reader.result as string
                console.log(base64)
                onAddImage(base64)
              }
              reader.readAsDataURL(file)
            }
          }
          input.click()
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        add image
      </button>
    </>
  )
}
