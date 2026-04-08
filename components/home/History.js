import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Camera, X } from "lucide-react"
import { useState, useMemo } from "react"

export default function History() {
  const [activeYear, setActiveYear] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  const editions = useMemo(
    () => [
      { num: "16ª", year: "2024", images: [] },
      {
        num: "15ª",
        year: "2022",
        images: [
          "/images/edicoes-anteriores/simpovidro-2022/1.jpg",
          "/images/edicoes-anteriores/simpovidro-2022/2.jpg",
          "/images/edicoes-anteriores/simpovidro-2022/3.jpg",
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
      src: "/images/edicoes-anteriores/simpovidro-2022/1.jpg",
      year: "2022",
      span: "row-span-2 col-span-2",
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
      span: "row-span-2 col-span-1",
    },
    {
      src: "/images/edicoes-anteriores/simpovidro-2013/simpovidro_01.jpg",
      year: "2013",
      span: "row-span-1 col-span-1",
    },
    {
      src: "/images/edicoes-anteriores/simpovidro-2011/simpovidro_01.jpg",
      year: "2011",
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
    <section className="py-24 bg-slate-50 border-y border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="relative z-10 sticky top-24">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 italic tracking-tighter uppercase leading-none">
              Uma Tradição <br />
              <span className="text-blue-600">de Sucesso</span>
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed italic font-medium max-w-xl">
              Há quase 30 anos, o Simpovidro une o mercado para gerar bilhões em
              parcerias e conexões. Explore os momentos que definiram a história
              do nosso setor.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {editions.map((ed, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setActiveYear(ed.year)}
                  onMouseLeave={() => setActiveYear(null)}
                  onClick={() =>
                    setSelectedYear(selectedYear === ed.year ? null : ed.year)
                  }
                  className={`px-3 py-2 rounded-xl border font-bold text-[10px] transition-all flex flex-col items-center justify-center text-center ${
                    selectedYear === ed.year
                      ? "bg-blue-600 border-blue-600 text-white scale-105 shadow-lg shadow-blue-500/40"
                      : activeYear === ed.year
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : "bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  <span className="opacity-70">{ed.num} Edição</span>
                  <span className="text-sm font-black tracking-tight">
                    {ed.year}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Camera className="text-blue-600 h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Galeria Histórica
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    + de 500 fotos arquivadas
                  </p>
                </div>
              </div>

              {selectedYear && (
                <button
                  onClick={() => setSelectedYear(null)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <X className="w-4 h-4" /> Resetar Galeria
                </button>
              )}
            </div>
          </div>

          <div className="relative min-h-[650px]">
            {/* Gallery Header for Selected Year */}
            {selectedYear && (
              <div className="mb-6 animate-in fade-in slide-in-from-left duration-500">
                <h4 className="text-2xl font-black text-slate-900 italic uppercase">
                  Galeria <span className="text-blue-600">{selectedYear}</span>
                </h4>
                <p className="text-slate-500 text-sm font-medium">
                  Fotos exclusivas da{" "}
                  {editions.find((e) => e.year === selectedYear)?.num} edição
                </p>
              </div>
            )}

            {/* Gallery Grid */}
            <div className="grid grid-cols-3 grid-rows-3 gap-4 h-[650px]">
              {displayImages.map((img, i) => (
                <button
                  key={`${selectedYear || "highlights"}-${i}`}
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
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-1000 group-hover:scale-110"
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
                    Imagens desta edição em breve
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
            className="absolute top-6 right-6 text-white hover:rotate-90 transition-transform p-2 bg-white/10 rounded-full backdrop-blur-lg"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt="Simpovidro Preview"
              layout="fill"
              objectFit="contain"
              className="bg-slate-900/50"
            />
          </div>
        </div>
      )}
    </section>
  )
}
