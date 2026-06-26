import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Camera, X } from "lucide-react"
import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/router"

export default function History() {
  const router = useRouter()
  const isEn = router?.locale === "en"
  const t = (pt, en) => (isEn ? en : pt)

  const getOrdinalEn = (numStr) => {
    if (!numStr) return ""
    const n = parseInt(numStr.replace("ª", ""), 10)
    if (isNaN(n)) return numStr
    if (n === 1) return "1st"
    if (n === 2) return "2nd"
    if (n === 3) return "3rd"
    return `${n}th`
  }

  const [activeYear, setActiveYear] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const editionsRef = useRef(null)
  const galleryRef = useRef(null)

  const editions = useMemo(
    () => [
      {
        num: "16ª",
        year: "2024",
        images: [
          "/images/edicoes-anteriores/simpovidro-2024/1.jpg",
          "/images/edicoes-anteriores/simpovidro-2024/2.jpg",
          "/images/edicoes-anteriores/simpovidro-2024/3.jpg",
          "/images/edicoes-anteriores/simpovidro-2024/4.jpg",
          "/images/edicoes-anteriores/simpovidro-2024/5.jpg",
          "/images/edicoes-anteriores/simpovidro-2024/6.jpg",
        ],
      },
      {
        num: "15ª",
        year: "2022",
        images: [
          "/images/edicoes-anteriores/simpovidro-2022/6.jpg",
          "/images/edicoes-anteriores/simpovidro-2022/1.jpg",
          "/images/edicoes-anteriores/simpovidro-2022/2.jpg",
          "/images/edicoes-anteriores/simpovidro-2022/4.jpg",
          "/images/edicoes-anteriores/simpovidro-2022/5.jpg",
        ],
      },
      {
        num: "14ª",
        year: "2019",
        images: [
          "/images/edicoes-anteriores/simpovidro-2019/1.jpg",
          "/images/edicoes-anteriores/simpovidro-2019/10.jpg",
          "/images/edicoes-anteriores/simpovidro-2019/2.jpg",
          "/images/edicoes-anteriores/simpovidro-2019/3.jpg",
          "/images/edicoes-anteriores/simpovidro-2019/5.jpg",
          "/images/edicoes-anteriores/simpovidro-2019/8.jpg",
        ],
      },
      {
        num: "13ª",
        year: "2017",
        images: [
          "/images/edicoes-anteriores/simpovidro-2017/1.jpg",
          "/images/edicoes-anteriores/simpovidro-2017/2.jpg",
          "/images/edicoes-anteriores/simpovidro-2017/3.jpg",
          "/images/edicoes-anteriores/simpovidro-2017/4.jpg",
          "/images/edicoes-anteriores/simpovidro-2017/5.jpg",
        ],
      },
      {
        num: "12ª",
        year: "2015",
        images: [
          "/images/edicoes-anteriores/simpovidro-2015/1.jpg",
          "/images/edicoes-anteriores/simpovidro-2015/2.jpg",
          "/images/edicoes-anteriores/simpovidro-2015/3.jpg",
          "/images/edicoes-anteriores/simpovidro-2015/4.jpg",
          "/images/edicoes-anteriores/simpovidro-2015/5.jpg",
        ],
      },
      {
        num: "11ª",
        year: "2013",
        images: [
          "/images/edicoes-anteriores/simpovidro-2013/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-2013/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-2013/simpovidro_03.jpg",
          "/images/edicoes-anteriores/simpovidro-2013/simpovidro_05.jpg",
        ],
      },
      {
        num: "10ª",
        year: "2011",
        images: [
          "/images/edicoes-anteriores/simpovidro-2011/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-2011/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-2011/simpovidro_03.jpg",
          "/images/edicoes-anteriores/simpovidro-2011/simpovidro_04.jpg",
          "/images/edicoes-anteriores/simpovidro-2011/simpovidro_05.jpg",
        ],
      },
      {
        num: "9ª",
        year: "2009",
        images: [
          "/images/edicoes-anteriores/simpovidro-2009/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-2009/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-2009/simpovidro_03.jpg",
          "/images/edicoes-anteriores/simpovidro-2009/simpovidro_04.jpg",
          "/images/edicoes-anteriores/simpovidro-2009/simpovidro_05.jpg",
        ],
      },
      {
        num: "8ª",
        year: "2007",
        images: [
          "/images/edicoes-anteriores/simpovidro-2007/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-2007/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-2007/simpovidro_03.jpg",
          "/images/edicoes-anteriores/simpovidro-2007/simpovidro_04.jpg",
          "/images/edicoes-anteriores/simpovidro-2007/simpovidro_05.jpg",
        ],
      },
      {
        num: "7ª",
        year: "2005",
        images: [
          "/images/edicoes-anteriores/simpovidro-2005/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-2005/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-2005/simpovidro_03.jpg",
          "/images/edicoes-anteriores/simpovidro-2005/simpovidro_04.jpg",
          "/images/edicoes-anteriores/simpovidro-2005/simpovidro_05.jpg",
        ],
      },
      {
        num: "6ª",
        year: "2003",
        images: [
          "/images/edicoes-anteriores/simpovidro-2003/simpovidro_01 .jpg",
          "/images/edicoes-anteriores/simpovidro-2003/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-2003/simpovidro_03.jpg",
          "/images/edicoes-anteriores/simpovidro-2003/simpovidro_04.jpg",
          "/images/edicoes-anteriores/simpovidro-2003/simpovidro_05.jpg",
        ],
      },
      {
        num: "5ª",
        year: "2001",
        images: [
          "/images/edicoes-anteriores/simpovidro-2001/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-2001/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-2001/simpovidro_03.jpg",
          "/images/edicoes-anteriores/simpovidro-2001/simpovidro_04.jpg",
          "/images/edicoes-anteriores/simpovidro-2001/simpovidro_05.jpg",
        ],
      },
      {
        num: "4ª",
        year: "1999",
        images: [
          "/images/edicoes-anteriores/simpovidro-1999/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-1999/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-1999/simpovidro_03.jpg",
          "/images/edicoes-anteriores/simpovidro-1999/simpovidro_04.jpg",
          "/images/edicoes-anteriores/simpovidro-1999/simpovidro_05.jpg",
          "/images/edicoes-anteriores/simpovidro-1999/simpovidro_06.jpg",
        ],
      },
      {
        num: "3ª",
        year: "1997",
        images: [
          "/images/edicoes-anteriores/simpovidro-1997/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-1997/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-1997/simpovidro_03.jpg",
        ],
      },
      {
        num: "2ª",
        year: "1996",
        images: [
          "/images/edicoes-anteriores/simpovidro-1996/simpovidro_01 .jpg",
          "/images/edicoes-anteriores/simpovidro-1996/simpovidro_02.jpg",
        ],
      },
      {
        num: "1ª",
        year: "1995",
        images: [
          "/images/edicoes-anteriores/simpovidro-1995/simpovidro_01.jpg",
          "/images/edicoes-anteriores/simpovidro-1995/simpovidro_02.jpg",
          "/images/edicoes-anteriores/simpovidro-1995/simpovidro_03.jpg",
        ],
      },
    ],
    [],
  )

  // Visual highlights for the grid (shown when no edition is selected)
  const galleryHighlights = [
    {
      src: "/images/edicoes-anteriores/simpovidro-2024/1.jpg",
      year: "2024",
      span: "row-span-2 col-span-2",
    },
    {
      src: "/images/edicoes-anteriores/simpovidro-2022/1.jpg",
      year: "2022",
      span: "row-span-1 col-span-1",
    },
    {
      src: "/images/edicoes-anteriores/simpovidro-2019/1.jpg",
      year: "2019",
      span: "row-span-1 col-span-1",
    },
    {
      src: "/images/edicoes-anteriores/simpovidro-2017/1.jpg",
      year: "2017",
      span: "row-span-1 col-span-1",
    },
    {
      src: "/images/edicoes-anteriores/simpovidro-2015/1.jpg",
      year: "2015",
      span: "row-span-1 col-span-1",
    },
    {
      src: "/images/edicoes-anteriores/simpovidro-2013/simpovidro_01.jpg",
      year: "2013",
      span: "row-span-1 col-span-1",
    },
  ]

  const selectedEdition = useMemo(
    () => editions.find((ed) => ed.year === selectedYear),
    [selectedYear, editions],
  )

  const displayImages =
    selectedYear && selectedEdition && selectedEdition.images.length > 0
      ? selectedEdition.images.slice(0, 6).map((src, i) => ({
          src,
          year: selectedYear,
          span: i === 0 ? "row-span-2 col-span-2" : "row-span-1 col-span-1",
        }))
      : galleryHighlights

  return (
    <section
      id="edicoes-anteriores"
      className="py-16 md:py-24 bg-slate-50 border-y border-slate-200 overflow-hidden "
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 ">
          <div className="relative z-10 lg:sticky lg:top-24 min-w-0">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-none font-title">
              {t(
                <>
                  Uma tradição <br />
                  <span className="text-blue-600">de sucesso</span>
                </>,
                <>
                  A tradition <br />
                  <span className="text-blue-600">of success</span>
                </>,
              )}
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-8 md:mb-10 leading-relaxed font-medium max-w-xl">
              {t(
                "Há mais de 30 anos, o Simpovidro une o mercado para gerar bilhões em parcerias e conexões. Explore os momentos que definiram a história do nosso setor.",
                "For over 30 years, Simpovidro has united the market to generate billions in partnerships and connections. Explore the moments that defined the history of our industry.",
              )}
            </p>

            <div className="relative">
              <div
                ref={editionsRef}
                className="flex px-4 pt-4 pb-4 lg:pb-12 flex-nowrap touch-pan-x overflow-x-auto lg:grid lg:grid-cols-4 gap-3 -mx-6 lg:mx-0 scrollbar-none snap-x snap-mandatory scroll-smooth"
              >
                {editions.map((ed, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setActiveYear(ed.year)}
                    onMouseLeave={() => setActiveYear(null)}
                    onClick={() =>
                      setSelectedYear(selectedYear === ed.year ? null : ed.year)
                    }
                    className={`flex-shrink-0 w-24 lg:w-auto snap-center px-3 py-2.5 rounded-xl border font-bold text-[10px] transition-all flex flex-col items-center justify-center text-center ${
                      selectedYear === ed.year
                        ? "bg-blue-600 border-blue-600 text-white scale-105 shadow-lg shadow-blue-500/40"
                        : activeYear === ed.year
                          ? "bg-blue-50 border-blue-200 text-blue-600"
                          : "bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    <span className="opacity-70">
                      {t(`${ed.num} Edição`, `${getOrdinalEn(ed.num)} Edition`)}
                    </span>
                    <span className="text-sm font-black tracking-tight">
                      {ed.year}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-0 lg:min-h-[650px] min-w-0">
            {/* Gallery Header for Selected Year */}
            {selectedYear && (
              <div className="mb-6 animate-in fade-in slide-in-from-left duration-500">
                <h4 className="text-2xl font-black text-slate-900">
                  {t("Galeria", "Gallery")}{" "}
                  <span className="text-blue-600">{selectedYear}</span>
                </h4>
                <p className="text-slate-500 text-sm font-medium">
                  {t(
                    `Fotos exclusivas da ${editions.find((e) => e.year === selectedYear)?.num} edição`,
                    `Exclusive photos of the ${getOrdinalEn(editions.find((e) => e.year === selectedYear)?.num)} edition`,
                  )}
                </p>
              </div>
            )}

            {/* Mobile Gallery (Horizontal Scroll with Controls) */}
            <div className="relative md:hidden group/gallery">
              <div
                ref={galleryRef}
                className="flex flex-nowrap touch-pan-x overflow-x-auto gap-3 pb-6 -mx-6 px-6 scrollbar-none snap-x snap-mandatory h-[380px] scroll-smooth"
              >
                {displayImages.map((img, i) => (
                  <div
                    key={`mobile-${selectedYear || "highlights"}-${i}`}
                    onClick={() => setPreviewImage(img.src)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setPreviewImage(img.src)
                      }
                    }}
                    className={`flex-shrink-0 w-[82vw] sm:w-[350px] snap-start relative rounded-[2rem] overflow-hidden shadow-xl transition-all duration-500 cursor-pointer ${
                      !selectedYear && activeYear && activeYear !== img.year
                        ? "opacity-30 scale-95 grayscale"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt={`Simpovidro ${img.year}`}
                      fill
                      className="object-cover pointer-events-none"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent p-6 flex items-end justify-between">
                      <span className="text-white font-bold text-sm">
                        {selectedYear
                          ? `${t("Foto", "Photo")} ${i + 1}`
                          : `${img.year}`}
                      </span>
                      <Badge className="bg-blue-600 text-white border-none text-[10px] font-black px-2 py-0.5">
                        {img.year}
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* Empty state handling if a clicked year has no images yet (mobile) */}
                {selectedYear && selectedEdition?.images.length === 0 && (
                  <div className="flex-shrink-0 w-[80vw] sm:w-[350px] snap-center flex flex-col items-center justify-center bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <Camera className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-bold italic text-sm text-center px-4">
                      {t(
                        "Imagens desta edição em breve",
                        "Images of this edition coming soon",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Gallery (Classic Mosaico Grid) */}
            <div className="hidden md:grid grid-cols-3 grid-rows-3 gap-4 h-[650px]">
              {displayImages.map((img, i) => (
                <button
                  key={`desktop-${selectedYear || "highlights"}-${i}`}
                  onClick={() => setPreviewImage(img.src)}
                  className={`group relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 animate-in zoom-in-95 duration-500 ${img.span} ${
                    !selectedYear && activeYear && activeYear !== img.year
                      ? "opacity-30 scale-95 grayscale"
                      : "opacity-100 scale-100"
                  }`}
                >
                  <Image
                    src={img.src}
                    alt={`Simpovidro ${img.year}`}
                    fill
                    className="transition-transform duration-1000 group-hover:scale-110 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 text-left">
                    <Badge className="bg-blue-600 text-white border-none text-xs font-black px-3 py-1">
                      {img.year}
                    </Badge>
                  </div>
                </button>
              ))}

              {/* Empty state handling if a clicked year has no images yet */}
              {selectedYear && selectedEdition?.images.length === 0 && (
                <div className="col-span-3 row-span-3 flex flex-col items-center justify-center bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <Camera className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold italic">
                    {t(
                      "Imagens desta edição em breve",
                      "Images of this edition coming soon",
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Decors */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white hover:rotate-90 transition-transform p-2 bg-white/10 rounded-full backdrop-blur-lg"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <div
            className="relative w-full max-w-5xl aspect-[4/3] md:aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt="Simpovidro Preview"
              fill
              className="bg-slate-900/50 object-contain"
            />
          </div>
        </div>
      )}
    </section>
  )
}
