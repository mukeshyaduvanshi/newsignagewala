"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

// Global pptxgen variable from CDN
declare global {
  interface Window {
    PptxGenJS: any;
  }
}

function ComponentsPptGen({ id }: { id: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const [messageIndex, setMessageIndex] = useState<number>(-1)
  const [pptxLoaded, setPptxLoaded] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [dataNotFound, setDataNotFound] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Component mount hone par pptxgenjs load karein
  useEffect(() => {
    const checkPptxgen = () => {
      if (typeof window !== 'undefined' && window.PptxGenJS) {
        setPptxLoaded(true);
      } else {
        setTimeout(checkPptxgen, 100);
      }
    };
    checkPptxgen();
  }, []);

  // ID validation check karo component load hone par
  useEffect(() => {
    const validateId = async () => {
      try {
        const res = await fetch(`/api/pptgen/fetch-data?id=${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (res.status === 404) {
          setDataNotFound(true);
        } else if (!res.ok) {
          throw new Error('Failed to validate ID');
        }
        
        setInitialLoading(false);
      } catch (error) {
        console.error('Error validating ID:', error);
        setDataNotFound(true);
        setInitialLoading(false);
      }
    };

    if (id) {
      validateId();
    } else {
      setDataNotFound(true);
      setInitialLoading(false);
    }
  }, [id]);

  // Image dimensions get karne ke liye function
  function getImageDimensions(
    imageURL: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imageURL;

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = (err) => {
        reject("Failed to load image: " + err);
      };
    });
  }

  const handleDownloadPPT = async () => {
    setIsLoading(true)
    
    try {
      // Step 1: API se data fetch karo
      const res = await fetch(`/api/pptgen/fetch-data?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const apiResponse = await res.json();
      console.log('API Response:', apiResponse);
      
      if (res.status === 404 || !apiResponse.success || !apiResponse.data) {
        setDataNotFound(true);
        return;
      }

      // Step 2: Data ko process karo aur image dimensions add karo
      const processedData = await Promise.all(
        apiResponse.data.map(async (store: any) => {
          let storePhotoWidth = null;
          let storePhotoHeight = null;
          if (store.storePhoto) {
            try {
              const dim = await getImageDimensions(store.storePhoto);
              storePhotoWidth = dim.width;
              storePhotoHeight = dim.height;
            } catch {
              storePhotoWidth = null;
              storePhotoHeight = null;
            }
          }
          return {
            storeName: store.storeName,
            storeAddress: store.storeAddress,
            storeGPSLocation: store.storeGPSLocation || { lat: "", lng: "" },
            storePhoto: store.storePhoto,
            storePhotoWidth,
            storePhotoHeight,
            sites: await Promise.all(
              (store.sites || []).map(async (site: any) => {
                let beforeImageWidth = null;
                let beforeImageHeight = null;
                if (site.beforeImage) {
                  try {
                    const dim = await getImageDimensions(site.beforeImage);
                    beforeImageWidth = dim.width;
                    beforeImageHeight = dim.height;
                  } catch {
                    beforeImageWidth = null;
                    beforeImageHeight = null;
                  }
                }
                
                let afterImageWidth = null;
                let afterImageHeight = null;
                if (site.afterImage) {
                  try {
                    const dim = await getImageDimensions(site.afterImage);
                    afterImageWidth = dim.width;
                    afterImageHeight = dim.height;
                  } catch {
                    afterImageWidth = null;
                    afterImageHeight = null;
                  }
                }
                
                // Process additional after images
                const additionalAfterImagesWithDim = await Promise.all(
                  (site.additionalAfterImages || []).map(async (imgUrl: string) => {
                    try {
                      const dim = await getImageDimensions(imgUrl);
                      return {
                        url: imgUrl,
                        width: dim.width,
                        height: dim.height
                      };
                    } catch {
                      return {
                        url: imgUrl,
                        width: null,
                        height: null
                      };
                    }
                  })
                );
                
                return {
                  beforeImage: site.beforeImage,
                  beforeImageWidth,
                  beforeImageHeight,
                  afterImage: site.afterImage,
                  afterImageWidth,
                  afterImageHeight,
                  additionalAfterImages: additionalAfterImagesWithDim,
                  siteElemName: site.siteElemName,
                  siteWidth: site.siteWidth,
                  siteHeight: site.siteHeight,
                  sitemUnit: site.sitemUnit,
                  siteDesc: site.siteDesc,
                  siteNumber: site.siteNumber,
                };
              })
            ),
          };
        })
      );

      console.log('Processed Data with dimensions:', processedData);

      // Step 3: PPT generate karo
      if (!pptxLoaded || !window.PptxGenJS) {
        throw new Error("Presentation library not loaded yet. Please try again.");
      }

      // PPT create karein
      const pres = new window.PptxGenJS();

      // processedData ko map karein
      processedData.forEach((store: any, _storeIndex: number) => {
        // Store ki main slide
        const slide = pres.addSlide();

        // GPS coordinates top me - properly spaced
        slide.addText(`Lat: ${store.storeGPSLocation.lat || "N/A"}`, {
          x: 0.5,
          y: 0.2,
          w: 3.5,
          h: 0.4,
          fontSize: 12,
          align: "left",
        });

        slide.addText(`Lng: ${store.storeGPSLocation.lng || "N/A"}`, {
          x: 5,
          y: 0.2,
          w: 4,
          h: 0.4,
          fontSize: 12,
          align: "left",
        });

        // Store name - large and clear
        slide.addText(`${store.storeName || "N/A"}`, {
          x: 0.5,
          y: 0.7,
          w: 4.5,
          h: 0.6,
          fontSize: 18,
          bold: true,
          align: "left",
        });

        // Store address - below coordinates
        slide.addText(`${store.storeAddress || "N/A"}`, {
          x: 5,
          y: 0.7,
          w: 4.5,
          h: 0.5,
          fontSize: 13,
          align: "left",
        });

        // Store photo center me - large size
        if (store.storePhoto && store.storePhotoWidth && store.storePhotoHeight) {
          try {
            // Store photo ko aspect ratio ke saath fit karo
            slide.addImage({
              path: store.storePhoto,
              x: 2.5,
              y: 1.8,
              ...(() => {
              const maxW = 5; // inches
              const maxH = 3.5; // inches
              const imgW = store.storePhotoWidth;
              const imgH = store.storePhotoHeight;
              if (!imgW || !imgH) return {};
              const aspect = imgW / imgH;
              let w = maxW, h = maxW / aspect;
              if (h > maxH) {
                h = maxH;
                w = maxH * aspect;
              }
              return { w, h };
              })(),
            });
          } catch (imageError) {
            console.log("Store image load error:", imageError);
          }
        }

        // Har site ke liye alag slide banayein
        if (store.sites && Array.isArray(store.sites)) {
          store.sites.forEach((site: any, siteIndex: number) => {
            const siteSlide = pres.addSlide();

            // Site slide title top me
            siteSlide.addText(
              `Site ${site.siteNumber || siteIndex + 1} - ${store.storeName}`,
              {
                x: 0.5,
                y: 0.3,
                w: 9,
                h: 0.5,
                fontSize: 18,
                bold: true,
                color: "363636",
                align: "center",
              }
            );

            // Site element name aur size info - properly spaced
            siteSlide.addText(`Element: ${site.siteElemName || "N/A"}`, {
              x: 0.5,
              y: 0.9,
              w: 4,
              h: 0.3,
              fontSize: 12,
              bold: true,
              align: "left",
            });

            siteSlide.addText(`Size: ${site.siteWidth || "N/A"} X ${site.siteHeight || "N/A"} ${site.sitemUnit || ""}`, {
              x: 5,
              y: 0.9,
              w: 4,
              h: 0.3,
              fontSize: 12,
              align: "left",
            });

            siteSlide.addText(`${site.siteDesc || "N/A"}`, {
              x: 0.5,
              y: 1.25,
              w: 9,
              h: 0.3,
              fontSize: 11,
              align: "center",
            });

            // Before aur After images labels
            siteSlide.addText("Before", {
              x: 1.25,
              y: 1.6,
              w: 2.5,
              h: 0.3,
              fontSize: 14,
              bold: true,
              align: "center",
            });

            siteSlide.addText("After", {
              x: 6.25,
              y: 1.6,
              w: 2.5,
              h: 0.3,
              fontSize: 14,
              bold: true,
              align: "center",
            });

            // Before aur After images side by side with proper dimensions
            if (site.beforeImage && site.beforeImageWidth && site.beforeImageHeight) {
              try {
                siteSlide.addImage({
                  path: site.beforeImage,
                  x: 0.5,
                  y: 2,
                    // Calculate aspect ratio and fit within max width/height
                    ...(() => {
                    const maxW = 4; // inches
                    const maxH = 3.5;   // inches
                    const imgW = site.beforeImageWidth;
                    const imgH = site.beforeImageHeight;
                    if (!imgW || !imgH) return {};
                    const aspect = imgW / imgH;
                    let w = maxW, h = maxW / aspect;
                    if (h > maxH) {
                      h = maxH;
                      w = maxH * aspect;
                    }
                    return { w, h };
                    })(),
                });
              } catch (imageError) {
                console.log("Before image load error:", imageError);
              }
            }

            if (site.afterImage && site.afterImageWidth && site.afterImageHeight) {
              try {
                siteSlide.addImage({
                  path: site.afterImage,
                  x: 5.5,
                  y: 2,
                  // Calculate aspect ratio and fit within max width/height
                  ...(() => {
                  const maxW = 4; // inches
                  const maxH = 3.5;   // inches
                  const imgW = site.afterImageWidth;
                  const imgH = site.afterImageHeight;
                  if (!imgW || !imgH) return {};
                  const aspect = imgW / imgH;
                  let w = maxW, h = maxW / aspect;
                  if (h > maxH) {
                    h = maxH;
                    w = maxH * aspect;
                  }
                  return { w, h };
                  })(),
                });
              } catch (imageError) {
                console.log("After image load error:", imageError);
              }
            }
            
            // Additional after images ke liye separate slides
            if (site.additionalAfterImages && site.additionalAfterImages.length > 0) {
              site.additionalAfterImages.forEach((additionalImg: any, addIdx: number) => {
                const additionalSlide = pres.addSlide();
                
                // Title
                additionalSlide.addText(
                  `Site ${site.siteNumber || siteIndex + 1} - ${store.storeName} (After Photo ${addIdx + 2})`,
                  {
                    x: 0.5,
                    y: 0.3,
                    w: 9,
                    h: 0.5,
                    fontSize: 18,
                    bold: true,
                    color: "363636",
                    align: "center",
                  }
                );
                
                // Additional after image
                if (additionalImg.url && additionalImg.width && additionalImg.height) {
                  try {
                    additionalSlide.addImage({
                      path: additionalImg.url,
                      x: 1.5,
                      y: 1.5,
                      ...(() => {
                        const maxW = 7; // inches
                        const maxH = 4.5;   // inches
                        const imgW = additionalImg.width;
                        const imgH = additionalImg.height;
                        if (!imgW || !imgH) return {};
                        const aspect = imgW / imgH;
                        let w = maxW, h = maxW / aspect;
                        if (h > maxH) {
                          h = maxH;
                          w = maxH * aspect;
                        }
                        return { w, h };
                      })(),
                    });
                  } catch (imageError) {
                    console.log("Additional after image load error:", imageError);
                  }
                }
              });
            }
          });
        }
      });

      // PPT download karein
      const fileName = apiResponse.orderNumber 
        ? `${apiResponse.orderNumber}_Installation_Report.pptx`
        : "Installation_Report.pptx";
      await pres.writeFile({ fileName });
      console.log('PPT generated successfully!');

      // Step 4: PPT download ke baad temp data delete karo
      try {
        const deleteRes = await fetch(`/api/pptgen/delete-temp-data?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const deleteResponse = await deleteRes.json();
        console.log('Delete API Response:', deleteResponse);
        
        if (deleteResponse.success) {
          console.log('Temp data deleted successfully for ID:', deleteResponse.id);
        }
      } catch (deleteError) {
        console.error('Error deleting temp data:', deleteError);
        // Continue even if delete fails - don't block the user
      }

      // Step 5: 5 seconds ke baad tab close kar do
      setIsCompleted(true);
      setIsLoading(false);
      
      // Countdown timer start karo
      let timeLeft = 5;
      setCountdown(timeLeft);
      
      const countdownInterval = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          console.log('Closing tab...');
          if (typeof window !== 'undefined') {
            window.close();
            // Fallback: agar window.close() work nahi kare to back button redirect
            if (!window.closed) {
              window.history.back();
            }
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error downloading PPT:', error)
    } finally {
      if (!isCompleted) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    // Show a single message at a time and rotate it every 5 seconds while loading
    let interval: any = null

    if (isLoading) {
      // start immediately with the first message
      setMessageIndex(0)
      interval = setInterval(() => {
        setMessageIndex(prev => (prev >= 2 ? 0 : prev + 1))
      }, 5000)
    } else {
      // reset when not loading
      setMessageIndex(-1)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading])

  // Show loading spinner during initial validation
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-6 bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-lg text-gray-600">Validating request...</p>
      </div>
    );
  }

  // Show not found page if data doesn't exist
  if (dataNotFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-6 bg-white">
        <div className="text-6xl">❌</div>
        <h1 className="text-3xl font-bold text-red-600">Data Not Found</h1>
        <p className="text-lg text-gray-600">The requested PPT data does not exist or has expired.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-6 bg-white">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
        Please click the button to download PPT
      </h1>
      
      <Button 
        onClick={handleDownloadPPT}
        disabled={isLoading || !pptxLoaded || isCompleted}
        className="px-8 py-3 text-lg font-medium cursor-pointer"
        size="lg"
      >
        {!pptxLoaded ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading Library...
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Downloading...
          </>
        ) : isCompleted ? (
          <>
            ✅ Download Complete
          </>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            Download PPT
          </>
        )}
      </Button>
      
      {isCompleted && (
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-green-600">
            PPT Downloaded Successfully!
          </p>
          <p className="text-sm text-red-600 font-medium">
            This tab will close automatically in {countdown} seconds...
          </p>
        </div>
      )}
      
      {isLoading && !isCompleted && (
        <div className="h-6">
          {messageIndex === 0 && (
            <p className="text-sm text-gray-600 animate-pulse">
              Preparing your presentation...
            </p>
          )}

          {messageIndex === 1 && (
            <p className="text-sm text-gray-600 animate-pulse">
              Wait for the download to complete...
            </p>
          )}

          {messageIndex === 2 && (
            <p className="text-sm text-gray-600 animate-pulse">
              Almost there...
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default ComponentsPptGen
