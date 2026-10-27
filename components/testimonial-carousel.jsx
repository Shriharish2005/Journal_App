"use client";

import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent } from "./ui/card";
import { Star, Quote, CheckCircle } from "lucide-react";
import testimonials from "@/data/testimonials";

const TestimonialCarousel = () => {
  return (
    <div className="mt-28 relative">
      <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-600 bg-orange-100/80 px-3 py-1 rounded-full">
          Writer Stories
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-950 tracking-tight">
          Loved by Mindful Writers
        </h2>
        <p className="text-stone-600 text-sm md:text-base">
          Discover how Reflct helps thousands cultivate reflection, reduce stress, and document life.
        </p>
      </div>

      <Carousel
        plugins={[
          Autoplay({
            delay: 3500,
          }),
        ]}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full max-w-6xl mx-auto px-4"
      >
        <CarouselContent className="-ml-4">
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="h-full bg-white/80 backdrop-blur-md border border-orange-200/70 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-4 right-4 text-orange-200 group-hover:text-orange-300 transition-colors pointer-events-none">
                  <Quote className="h-10 w-10 opacity-40" />
                </div>
                <CardContent className="p-7 flex flex-col justify-between h-full space-y-6">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>

                  {/* Testimonial Quote */}
                  <p className="text-stone-700 leading-relaxed text-sm italic relative z-10">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>

                  {/* Author Meta */}
                  <div className="pt-4 border-t border-orange-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {testimonial.author.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-orange-950 flex items-center gap-1">
                        <span>{testimonial.author}</span>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="text-xs text-orange-700/80 font-medium">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden sm:block">
          <CarouselPrevious className="border-orange-200 hover:bg-orange-100 text-orange-900 -left-6" />
          <CarouselNext className="border-orange-200 hover:bg-orange-100 text-orange-900 -right-6" />
        </div>
      </Carousel>
    </div>
  );
};

export default TestimonialCarousel;
