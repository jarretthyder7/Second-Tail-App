import Link from "next/link"

interface DogCardProps {
  dog: any
  href: string
  showLastUpdate?: boolean
}

export function DogCard({ dog, href, showLastUpdate = true }: DogCardProps) {

  const stageClass =
    dog.stage === "in_foster"
      ? "inline-flex items-center rounded-full bg-[#E8EFE6] px-3 py-1 text-xs font-semibold text-[#5A4A42]"
      : dog.stage === "medical_hold"
        ? "inline-flex items-center rounded-full bg-[#D97A68] px-3 py-1 text-xs font-semibold text-white"
        : "inline-flex items-center rounded-full bg-[#F7E2BD] px-3 py-1 text-xs font-semibold text-[#5A4A42]"

  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="w-full h-36 sm:h-40 overflow-hidden bg-[#F7E2BD]">
          <img
            src={dog.photo || "/placeholder.svg?height=160&width=320"}
            alt={dog.name}
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#5A4A42]">{dog.name}</h3>
            <p className="text-xs sm:text-sm text-[#2E2E2E]/70">{dog.breed}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className={stageClass}>
              {dog.stage === "in_foster"
                ? "In Foster Care"
                : dog.stage === "medical_hold"
                  ? "Medical Hold"
                  : dog.stage === "available"
                    ? "Available"
                    : dog.stage === "adopted"
                      ? "Adopted"
                      : "Recovering"}
            </span>
          </div>

          {showLastUpdate && <p className="text-xs text-[#2E2E2E]/60">Last update: {dog.lastUpdate}</p>}

          <div className="w-full text-center rounded-full bg-[#D76B1A] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white">
            Open profile
          </div>
        </div>
      </div>
    </Link>
  )
}
