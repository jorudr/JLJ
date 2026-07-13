<template>
  <div
    ref="journalWrapperRef"
    class="journal-wrapper force-light-theme bg-theme-bg text-theme-text h-full flex flex-col min-w-0 overflow-y-auto scroll-minimal relative pt-4 md:pt-6"
    :class="{
      'exforum-transparent-bg': isForumLightTheme,
      'exforum-edge-shadows': showForumEdgeShadows,
      '!overflow-hidden': isBoardFullscreen || isCreatingArticle
    }"
  >
    <Transition name="fade-slide">
      <section
        v-if="isBoardFullscreen"
        ref="boardViewportRef"
        class="fixed z-[9000] cursor-grab select-none overflow-hidden bg-white bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1.6px)] bg-[length:28px_28px] bg-center text-[#2c2c2a] active:cursor-grabbing"
        :style="boardFullscreenViewportStyle"
        :aria-label="articleLabels.fullscreenBoard"
        @pointerdown="startBoardPan"
        @wheel.prevent="handleBoardWheel"
      >
        <button
          class="absolute left-1/2 top-5 z-20 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 border border-black/20 bg-white/90 px-4 py-3 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-black/65 shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition-colors hover:border-black/40 hover:text-black sm:px-5"
          type="button"
          @click.stop="closeBoardFullscreen"
        >
          {{ fullscreenExitLabel }}
        </button>

        <div
          class="absolute left-0 top-0 origin-top-left"
          :style="[boardWorldStyle, boardTransformStyle]"
        >
          <article
            v-for="node in boardNodes"
            :key="node.id"
            data-board-node
            class="absolute box-border overflow-hidden border border-black/20 bg-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm"
            :style="getBoardNodeStyle(node)"
          >
            <div v-if="node.type === 'text'" class="flex h-full flex-col gap-3 p-4">
              <h3 class="font-serif text-xl italic leading-none text-black/80" v-html="node.title || 'Untitled'"></h3>
              <p class="min-h-0 overflow-hidden font-serif text-sm italic leading-relaxed text-black/55">{{ node.text }}</p>
            </div>

            <div v-else-if="node.type === 'image'" class="flex h-full flex-col">
              <img :src="node.src" :alt="node.alt" class="min-h-0 flex-1 object-cover" draggable="false" />
              <p v-if="node.caption" class="border-t border-black/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em] text-black/35">
                {{ node.caption }}
              </p>
            </div>

            <div v-else-if="node.type === 'drawing'" class="flex h-full w-full flex-col relative bg-transparent overflow-hidden">
              <img v-if="node.params?.preview" :src="node.params.preview" alt="" class="absolute inset-0 h-full w-full object-fill pointer-events-none" draggable="false" />
              <svg v-else class="absolute inset-0 w-full h-full pointer-events-none text-black" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline v-for="stroke in node.params?.strokes || []" :key="stroke.id" :points="drawing.formatDrawingStroke(stroke)" fill="none" :stroke="stroke.color || 'currentColor'" :stroke-width="stroke.size || 2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="opacity-90" />
              </svg>
            </div>

          </article>
        </div>
      </section>
    </Transition>

    <Transition name="fade-slide" mode="out-in">
    <!-- READER VIEW: Detailed Content -->
    <article v-if="selectedArticle" class="journal-article-reader flex flex-col min-h-full" key="reader">
      <header class="article-reader-header">
        <div class="article-reader-toolbar">
          <button @click="closeReader" class="article-reader-back group">
            <span class="text-xl opacity-30 group-hover:-translate-x-1 transition-transform">←</span>
            <span>{{ articleLabels.returnToJournal }}</span>
          </button>
        </div>

        <div class="article-reader-title-row">
          <div class="min-w-0">
            <h1>{{ selectedArticle.title }}</h1>
            <p>{{ selectedArticle.description }}</p>
          </div>

          <div class="article-reader-metrics" :aria-label="articleLabels.metrics">
            <div v-for="metric in selectedArticle.metrics" :key="metric.id" class="article-reader-metric">
              <span>{{ getMetricLabel(metric.label) }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>
        </div>
      </header>

      <main class="box-border flex w-full max-w-full flex-none overflow-hidden py-6">
        <section
          class="group relative box-border h-[68vh] min-h-[460px] w-full max-w-full flex-1 cursor-zoom-in select-none overflow-hidden border-y border-x-0 border-current/10 bg-white/20 bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1.6px)] bg-[length:22px_22px] bg-center shadow-inner sm:min-h-[min(72vh,780px)] sm:bg-[length:28px_28px]"
          :aria-label="articleLabels.board"
          @click="openBoardFullscreen"
        >
          <div
            class="pointer-events-none absolute left-0 top-0 origin-top-left"
            :style="[boardWorldStyle, boardPreviewTransformStyle]"
          >
            <article
              v-for="node in boardNodes"
              :key="node.id"
              data-board-node
              class="absolute box-border overflow-hidden border border-current/20 bg-white/85 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm"
              :style="getBoardNodeStyle(node)"
            >
              <div v-if="node.type === 'text'" class="flex h-full flex-col gap-3 p-4">
                <h3 class="font-serif text-xl italic leading-none text-current/80" v-html="node.title || 'Untitled'"></h3>
                <p class="min-h-0 overflow-hidden font-serif text-sm italic leading-relaxed text-current/55">{{ node.text }}</p>
              </div>

              <div v-else-if="node.type === 'image'" class="flex h-full flex-col">
                <img :src="node.src" :alt="node.alt" class="min-h-0 flex-1 object-cover" draggable="false" />
                <p v-if="node.caption" class="border-t border-current/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em] text-current/35">
                  {{ node.caption }}
                </p>
              </div>

              <div v-else-if="node.type === 'drawing'" class="flex h-full w-full flex-col relative bg-transparent overflow-hidden">
                <img v-if="node.params?.preview" :src="node.params.preview" alt="" class="absolute inset-0 h-full w-full object-fill pointer-events-none" draggable="false" />
                <svg v-else class="absolute inset-0 w-full h-full pointer-events-none text-current" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline v-for="stroke in node.params?.strokes || []" :key="stroke.id" :points="drawing.formatDrawingStroke(stroke)" fill="none" :stroke="stroke.color || 'currentColor'" :stroke-width="stroke.size || 2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="opacity-90" />
                </svg>
              </div>
            </article>
          </div>

          <div class="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.025]"></div>
          <div class="pointer-events-none absolute right-4 top-4 border border-current/10 bg-white/85 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em] text-current/35">
            {{ articleLabels.openBoard }}
          </div>
        </section>
      </main>

      <footer class="article-comments-footer">
        <div class="article-comments-heading">
          <div>
            <span>{{ articleLabels.comments }}</span>
          </div>
          <strong>{{ articleLabels.published }}: {{ articleComments.length }}</strong>
        </div>

        <form class="article-comment-composer" @submit.prevent="submitComment">
          <div class="article-comment-composer-title">
            <div>
              <span>{{ articleLabels.newComment }}</span>
              <h3>{{ articleLabels.leaveComment }}</h3>
            </div>
            <span v-if="!isAuthenticated" class="article-comment-composer-status">{{ articleLabels.signInRequired }}</span>
          </div>
          <div class="article-comment-composer-meta">
            <span>{{ articleLabels.commentingAs }}</span>
            <strong>{{ currentUserName }}</strong>
          </div>
          <textarea
            ref="commentInputRef"
            id="article-comment-input"
            v-model="commentDraft"
            class="article-comment-input"
            rows="1"
            maxlength="1000"
            :disabled="!isAuthenticated"
            :placeholder="isAuthenticated ? articleLabels.writeComment : articleLabels.signInToComment"
            @input="resizeCommentInput"
          ></textarea>
          <div class="article-comment-composer-actions">
            <span>{{ commentDraft.length }}/1000</span>
            <button
              class="article-comment-submit"
              type="submit"
              :disabled="!isAuthenticated || !commentDraft.trim()"
            >
              {{ articleLabels.postComment }}
            </button>
          </div>
        </form>

        <div v-if="articleComments.length" class="article-comments-list">
          <article v-for="comment in articleComments" :key="comment.id" class="article-comment">
            <div class="article-comment-head">
              <div>
                <h3>{{ comment.authorName }}</h3>
                <span>{{ comment.authorRole }}</span>
              </div>
              <div class="article-comment-meta">
                <span>{{ formatCommentDate(comment.createdAt) }}</span>
                <span>{{ comment.likesCount }} {{ articleLabels.likes }}</span>
              </div>
            </div>
            <p>{{ comment.text }}</p>
          </article>
        </div>

        <p v-else class="article-comments-empty">{{ articleLabels.noComments }}</p>
      </footer>

    </article>

    <!-- ARTICLE CREATION VIEW -->
    <div v-else-if="isCreatingArticle" class="absolute inset-0 z-50 bg-theme-bg overflow-hidden flex flex-col w-full" key="creator">
      <Transition name="fade-slide" mode="out-in">
        
        <!-- METADATA STEP -->
        <div v-if="creationStep === 'metadata'" class="flex flex-col h-full px-8 md:px-16 xl:px-32 py-10 relative overflow-hidden w-full max-w-7xl mx-auto" key="metadata">
          <!-- DRAFT METADATA HEADER -->
          <div class="flex flex-col md:flex-row justify-between md:items-end border-b-2 border-current/20 pb-4 mb-6 mt-6 space-y-4 md:space-y-0 shrink-0">
            <div class="flex flex-col space-y-2">
              <span class="text-[10px] font-mono tracking-[0.4em] uppercase opacity-70 font-bold">
                {{ locale === 'ru' ? 'Редактор' : 'Editor' }} // {{ formatJournalDate() }}
              </span>
              <span class="font-serif italic text-2xl text-current/80">{{ currentUserName }}</span>
            </div>
            
            <!-- INLINE CATEGORY SELECTOR -->
            <div class="flex flex-col md:items-end space-y-4">
              <span class="text-xs md:text-sm font-mono tracking-[0.4em] uppercase opacity-70 font-bold">
                {{ locale === 'ru' ? 'Выберите категорию' : 'Choose Category' }}
              </span>
              <div class="flex flex-wrap gap-4 md:space-x-6 md:gap-0">
                <button
                  v-for="type in articleTypes"
                  :key="type.value"
                  class="text-[11px] font-mono tracking-widest uppercase transition-all duration-300 border-b"
                  :class="newArticleForm.type === type.value ? 'opacity-100 border-current pb-1 font-bold' : 'opacity-50 border-transparent hover:opacity-100 pb-1'"
                  @click="newArticleForm.type = type.value"
                >
                  {{ type.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- MAIN EDITORIAL CANVAS -->
          <div class="flex-grow flex flex-col justify-center w-full max-w-5xl mx-auto space-y-6 min-h-0 pt-2 pb-6">
            
            <!-- Huge Title Input -->
            <div class="flex flex-col items-center group/title relative w-full shrink-0 pt-4">
              <span class="text-xs md:text-sm font-sans tracking-[0.2em] font-light uppercase transition-opacity duration-300 mb-2" :class="newArticleForm.title ? 'opacity-30' : 'opacity-60 group-focus-within/title:opacity-100'">
                {{ locale === 'ru' ? 'Введите заголовок' : 'Enter Title' }}
              </span>
              <input
                v-model="newArticleForm.title"
                type="text"
                maxlength="60"
                class="w-full bg-transparent text-4xl md:text-6xl lg:text-7xl font-serif italic tracking-tighter text-center focus:outline-none transition-colors placeholder:text-current/20"
                :placeholder="locale === 'ru' ? 'Заголовок...' : 'Title...'"
              />
              <div class="absolute -bottom-6 w-full flex justify-end px-4">
                <span class="text-[9px] font-mono transition-opacity duration-300" :class="newArticleForm.title.length > 0 ? 'opacity-40' : 'opacity-0 group-focus-within/title:opacity-40'">
                  {{ newArticleForm.title.length }} / 60
                </span>
              </div>
            </div>
            
            <div class="w-16 h-px bg-current/30 mx-auto my-2 shrink-0"></div>

            <!-- Description Textarea -->
            <div class="flex flex-col items-center group/desc relative w-full flex-grow min-h-0">
              <span class="text-xs md:text-sm font-sans tracking-[0.2em] font-light uppercase transition-opacity duration-300 mb-4 shrink-0" :class="newArticleForm.description ? 'opacity-30' : 'opacity-60 group-focus-within/desc:opacity-100'">
                {{ locale === 'ru' ? 'Введите описание' : 'Enter Description' }}
              </span>
              <textarea
                v-model="newArticleForm.description"
                @input="newArticleForm.description = newArticleForm.description.replace(/[\r\n]+/g, ' ')"
                maxlength="200"
                class="w-full h-full flex-grow min-h-0 bg-transparent text-lg md:text-xl lg:text-2xl font-serif text-center focus:outline-none transition-colors resize-none placeholder:text-current/20 leading-normal text-current/90"
                :placeholder="locale === 'ru' ? 'Краткое описание или тезис вашей статьи...' : 'Brief description or thesis of your article...'"
              ></textarea>
              <div class="absolute bottom-2 w-full flex justify-end px-4 shrink-0 pointer-events-none">
                <span class="text-[9px] font-mono transition-opacity duration-300" :class="newArticleForm.description.length > 0 ? 'opacity-40' : 'opacity-0 group-focus-within/desc:opacity-40'">
                  {{ newArticleForm.description.length }} / 200
                </span>
              </div>
            </div>
          </div>

          <!-- LAUNCH FOOTER -->
          <div class="border-t-2 border-current/20 pt-4 mt-auto flex justify-between items-center shrink-0">
            <!-- Cancel Button (Bottom Left) -->
            <button class="text-[11px] font-mono tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity flex items-center gap-2 group/cancel" @click="isCreatingArticle = false">
              <svg class="w-4 h-4 transition-transform group-hover/cancel:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M5 12l7-7M5 12l7 7"></path>
              </svg>
              <span>{{ locale === 'ru' ? 'ОТМЕНА' : 'CANCEL' }}</span>
            </button>

            <button
              class="group relative overflow-hidden px-8 py-3 border-2 transition-all duration-500 flex items-center justify-center space-x-4"
              :class="isNewArticleFormValid && !isSubmittingArticle ? 'border-black hover:bg-black cursor-pointer' : 'border-current/20 cursor-not-allowed'"
              :disabled="!isNewArticleFormValid || isSubmittingArticle"
              @click="submitNewArticle"
            >
              <span class="text-[11px] font-mono tracking-[0.4em] uppercase relative z-10 font-bold transition-all duration-500" 
                    :class="[
                      isSubmittingArticle ? 'opacity-0' : '',
                      isNewArticleFormValid ? 'text-black opacity-100 group-hover:text-white' : 'text-current opacity-30'
                    ]">
                {{ locale === 'ru' ? 'ПРОДОЛЖИТЬ' : 'CONTINUE' }}
              </span>
              <span v-if="!isSubmittingArticle" class="text-xl relative z-10 transition-all duration-500 font-light leading-none" 
                    :class="isNewArticleFormValid ? 'text-black opacity-100 group-hover:text-white group-hover:translate-x-1' : 'text-current opacity-30'">
                →
              </span>
              <svg v-else class="w-5 h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </button>
          </div>
        </div>

        <!-- BOARD STEP -->
        <div v-else-if="creationStep === 'board'"
             ref="boardStageRef"
             class="absolute inset-0 z-[100] overflow-hidden bg-white bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1.6px)] bg-[length:28px_28px] text-[#2c2c2a]"
             :class="isSpacePressed ? 'cursor-grab active:cursor-grabbing' : (activeBoardTool === 'pencil' ? 'cursor-none' : (activeBoardTool ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'))"
             @pointermove="handleBoardHover"
             @pointerdown="startBoardPan"
             @wheel.prevent="handleBoardWheel"
             key="board"
        >
          <!-- Darkening overlay -->
          <div class="absolute inset-0 bg-black/10 pointer-events-none"></div>

          <!-- Freehand Board Drawing Layer -->
          <canvas
            ref="boardDrawingCanvasRef"
            class="absolute inset-0 z-20 h-full w-full pointer-events-none"
          ></canvas>

          <!-- Board World (Pan & Zoom) -->
          <div class="absolute left-0 top-0 origin-top-left z-10" :style="[boardWorldStyle, boardTransformStyle]" ref="boardWorldRef"
               @pointerleave="boardDrawing.isBoardDrawingCursorVisible.value = false">
            <article
              v-for="node in boardNodes"
              :key="node.id"
              data-board-node
              :data-node-id="node.id"
              class="absolute box-border overflow-hidden bg-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm group/node transition-all border"
              :class="[
                selectedBoardNodeId === node.id ? 'border-black/60 ring-2 ring-black/10' : 'border-black/20',
                activeBoardTool === 'pencil' ? 'pointer-events-none select-none' : ''
              ]"
              :style="getBoardNodeStyle(node)"
              @contextmenu.prevent.stop="handleNodeContextMenu($event, node.id)"
            >
              <!-- Drag Handle -->
              <div 
                data-board-node-handle 
                :data-node-id="node.id"
                class="absolute top-0 left-0 w-full h-4 bg-black/5 hover:bg-black/10 cursor-move opacity-0 group-hover/node:opacity-100 transition-opacity z-10"
              ></div>

              <div v-if="node.type === 'text'" class="flex h-full w-full flex-col relative bg-transparent p-4 pt-6 gap-2">
                 <div :ref="(el) => setTitleEditorRef(el, node.id)"
                      :data-title-node-id="node.id"
                      contenteditable="true"
                      @mousedown.stop
                      @click.stop
                      @focus="selectedBoardNodeId = node.id; activeEditorField = 'title'"
                      @input="updateNodeTitle($event, node)"
                      @keydown.enter.prevent
                      class="relative z-10 font-serif text-xl italic leading-none text-black/80 break-words outline-none bg-transparent cursor-text"
                      data-placeholder="Untitled">
                 </div>
                 <span
                   v-if="isTextNodeTitleEmpty(node)"
                   class="pointer-events-none absolute left-4 right-4 top-6 z-0 font-serif text-xl italic leading-none text-black/40"
                 >
                   Untitled
                 </span>
                 <div :ref="(el) => setTextEditorRef(el, node.id)"
                      :data-text-node-id="node.id"
                      contenteditable="true"
                      @mousedown.stop
                      @click.stop
                      @focus="selectedBoardNodeId = node.id; activeEditorField = 'text'"
                      @input="updateNodeText($event, node)"
                      class="relative z-10 w-full flex-1 font-serif text-sm italic leading-relaxed text-black/55 bg-transparent outline-none overflow-y-auto cursor-text break-words whitespace-pre-wrap min-h-0 matrix-text-rich"
                      :data-placeholder="boardTextPlaceholder">
                 </div>
                 <span
                   v-if="isTextNodeBodyEmpty(node)"
                   class="pointer-events-none absolute left-4 right-4 top-[58px] z-0 font-serif text-sm italic leading-relaxed text-black/25"
                 >
                   {{ boardTextPlaceholder }}
                 </span>
              </div>
              <div v-else-if="node.type === 'image'" class="flex h-full flex-col pt-4">
                <img v-if="node.src" :src="node.src" :alt="node.alt" class="min-h-0 flex-1 object-contain cursor-pointer hover:opacity-90 transition-opacity" draggable="false" @click.stop="triggerImageUpload(node.id)" />
                <div v-else class="flex-1 flex flex-col items-center justify-center cursor-pointer border border-dashed border-black/20 m-4 hover:border-black/40 hover:bg-black/5 transition-all" @click.stop="triggerImageUpload(node.id)">
                   <svg class="w-8 h-8 opacity-40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   <span class="text-[10px] font-mono tracking-[0.2em] uppercase opacity-40 text-center px-4">Upload Image (RU/EN)</span>
                </div>
                <p v-if="node.caption" class="border-t border-black/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em] text-black/35">
                  {{ node.caption }}
                </p>
              </div>
              <div v-else-if="node.type === 'drawing'" class="flex h-full w-full flex-col relative bg-transparent overflow-hidden" @dblclick.stop="drawing.openDrawingFullscreen(node)">
                <img v-if="node.params?.preview"
                     :src="node.params.preview"
                     alt=""
                     class="absolute inset-0 h-full w-full object-fill pointer-events-none"
                     draggable="false" />
                <svg v-else
                     class="absolute inset-0 w-full h-full pointer-events-none text-black"
                     viewBox="0 0 100 100"
                     preserveAspectRatio="none">
                  <polyline v-for="stroke in node.params?.strokes || []"
                            :key="stroke.id"
                            :points="drawing.formatDrawingStroke(stroke)"
                            fill="none"
                            :stroke="stroke.color || 'currentColor'"
                            :stroke-width="stroke.size || 2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            vector-effect="non-scaling-stroke"
                            class="opacity-90" />
                </svg>
                <div v-if="!node.params?.strokes?.length" class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 text-[10px] font-mono tracking-widest uppercase text-center px-4">
                   Dbl-Click to Draw
                </div>
              </div>

              <!-- Resize Handle -->
              <div 
                data-board-resize 
                :data-node-id="node.id"
                class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover/node:opacity-100 transition-opacity z-10 flex items-end justify-end p-1"
              >
                <div class="w-2 h-2 border-r-2 border-b-2 border-black/40"></div>
              </div>
            </article>
          </div>

          <!-- Custom Cursor for Board Drawing -->
          <div v-if="activeBoardTool === 'pencil' && boardDrawing.isBoardDrawingCursorVisible.value && !isSpacePressed"
               class="absolute rounded-full pointer-events-none z-40 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
               :class="boardDrawing.boardDrawingTool.value === 'eraser' ? 'border-2 border-red-500 bg-red-500/10' : 'border-2 border-black bg-black/5'"
               :style="boardDrawing.boardDrawingCursorStyle.value">
          </div>

          <!-- Tooltip at the top center -->
          <div 
            v-if="activeBoardTool && activeBoardTool !== 'pencil'"
            class="pointer-events-none absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-2 bg-black text-white text-[10px] font-mono tracking-widest uppercase shadow-lg"
          >
            {{ locale === 'ru' ? 'Кликните чтобы добавить' : 'Click to add node' }}
          </div>

          <!-- Left Vertical Toolbar -->
          <ExPanel data-board-chrome variant="light" :no-padding="true" :show-corners="true" :no-shadow="true" class="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center py-2 px-1 border-black/20 !w-fit cursor-auto"
                   @pointerdown.stop
                   @pointermove.stop
                   @pointerenter="boardDrawing.isBoardDrawingCursorVisible.value = false">
            <button class="p-2 transition-colors group relative" 
                    :class="activeBoardTool === 'text' ? 'bg-black/10' : 'hover:bg-black/5'"
                    :title="locale === 'ru' ? 'Текст' : 'Text Node'"
                    @click.stop="activeBoardTool = activeBoardTool === 'text' ? null : 'text'">
              <svg class="w-5 h-5 transition-colors" :class="activeBoardTool === 'text' ? 'text-black' : 'text-black/60 group-hover:text-black'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 7V4h16v3M9 20h6M12 4v16" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="w-6 h-px bg-black/10 my-1"></div>
            <button class="p-2 transition-colors group relative" 
                    :class="activeBoardTool === 'image' ? 'bg-black/10' : 'hover:bg-black/5'"
                    :title="locale === 'ru' ? 'Изображение' : 'Image Node'"
                    @click.stop="activeBoardTool = activeBoardTool === 'image' ? null : 'image'">
              <svg class="w-5 h-5 transition-colors" :class="activeBoardTool === 'image' ? 'text-black' : 'text-black/60 group-hover:text-black'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="21 15 16 10 5 21" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="w-6 h-px bg-black/10 my-1"></div>
            <button class="p-2 transition-colors group relative" 
                    :class="activeBoardTool === 'drawing' ? 'bg-black/10' : 'hover:bg-black/5'"
                    :title="locale === 'ru' ? 'Рисунок' : 'Drawing Node'"
                    @click.stop="activeBoardTool = activeBoardTool === 'drawing' ? null : 'drawing'">
              <svg class="w-5 h-5 transition-colors" :class="activeBoardTool === 'drawing' ? 'text-black' : 'text-black/60 group-hover:text-black'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <path d="M2 2l7.586 7.586"/>
                <circle cx="11" cy="11" r="2"/>
              </svg>
            </button>
            <div class="w-6 h-px bg-black/10 my-1"></div>
            <button class="p-2 transition-colors group relative" 
                    :class="activeBoardTool === 'pencil' ? 'bg-black/10' : 'hover:bg-black/5'"
                    :title="locale === 'ru' ? 'Карандаш' : 'Pencil'"
                    @click.stop="activeBoardTool = activeBoardTool === 'pencil' ? null : 'pencil'">
              <svg class="w-5 h-5 transition-colors" :class="activeBoardTool === 'pencil' ? 'text-black' : 'text-black/60 group-hover:text-black'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
          </ExPanel>
          
          <!-- Right Vertical Toolbar (Pencil Settings) -->
          <div v-if="activeBoardTool === 'pencil'" data-board-chrome class="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-12 cursor-auto"
               @pointerdown.stop
               @pointermove.stop
               @pointerenter="boardDrawing.isBoardDrawingCursorVisible.value = false">
            <ExPanel variant="light" :no-padding="true" :show-corners="true" :no-shadow="true" class="flex flex-col items-center py-2 px-1 border-black/20 w-full h-full">
               <!-- Brush Tool -->
               <button class="p-2 transition-colors group relative"
                       :class="boardDrawing.boardDrawingTool.value === 'pencil' ? 'bg-black/10' : 'hover:bg-black/5'"
                       @click="boardDrawing.boardDrawingTool.value = 'pencil'"
                       :title="locale === 'ru' ? 'Кисть' : 'Brush'">
                  <div class="w-5 h-5 flex items-center justify-center">
                    <div class="w-2 h-2 rounded-full bg-black"></div>
                  </div>
               </button>

               <div class="w-6 h-px bg-black/10 my-1"></div>

               <!-- Eraser Tool -->
               <button class="p-2 transition-colors group relative"
                       :class="boardDrawing.boardDrawingTool.value === 'eraser' ? 'bg-black/10' : 'hover:bg-black/5'"
                       @click="boardDrawing.boardDrawingTool.value = 'eraser'"
                       :title="locale === 'ru' ? 'Ластик' : 'Eraser'">
                  <div class="w-5 h-5 flex items-center justify-center">
                    <div class="w-2 h-2 rounded-full border-2" :class="boardDrawing.boardDrawingTool.value === 'eraser' ? 'border-black' : 'border-black/60 group-hover:border-black'"></div>
                  </div>
               </button>

               <div class="w-6 h-px bg-black/10 my-1"></div>

               <!-- Size Slider (Vertical) -->
               <div class="flex flex-col items-center py-2 w-full gap-2">
                  <div class="w-5 h-5 flex items-center justify-center pointer-events-none">
                    <div class="rounded-full border border-black/40"
                         :style="{ width: `${Math.min(18, Math.max(5, boardDrawing.boardDrawingSize.value))}px`, height: `${Math.min(18, Math.max(5, boardDrawing.boardDrawingSize.value))}px`, backgroundColor: boardDrawing.boardDrawingColor.value }"></div>
                  </div>
                  <div class="relative h-32 w-10 touch-none select-none cursor-ns-resize group/slider" @pointerdown.stop.prevent="boardDrawing.startBoardDrawingSizeDrag">
                     <div class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-black/10 rounded-full group-hover/slider:bg-black/20 transition-colors"></div>
                     <div class="absolute left-1/2 w-2 h-2 bg-white border border-black/30 rounded-full shadow-sm pointer-events-none transition-transform group-active/slider:scale-110"
                          :style="{ bottom: `${boardDrawing.boardDrawingSizePercent.value}%`, transform: 'translate(-50%, 50%)' }">
                     </div>
                  </div>
               </div>

               <div class="w-6 h-px bg-black/10 my-1"></div>

               <!-- Color Picker -->
               <div class="flex flex-col items-center py-2 w-full">
                  <label class="w-5 h-5 rounded-full cursor-pointer border border-black/20 overflow-hidden hover:scale-110 transition-transform relative">
                     <input type="color" v-model="boardDrawing.boardDrawingColor.value" class="w-full h-full opacity-0 cursor-pointer absolute inset-0" />
                     <div class="w-full h-full" :style="{ backgroundColor: boardDrawing.boardDrawingColor.value }"></div>
                  </label>
               </div>
            </ExPanel>
          </div>
          <!-- Bottom Right Actions -->
          <div data-board-chrome class="absolute bottom-6 right-6 z-50 flex items-center gap-4 cursor-auto"
               @pointerdown.stop
               @pointermove.stop
               @pointerenter="boardDrawing.isBoardDrawingCursorVisible.value = false">
            <button class="px-6 py-3 border border-black/20 bg-white/90 shadow-sm text-[10px] font-mono uppercase tracking-widest hover:border-black/50 hover:bg-white transition-colors"
                    @click="creationStep = 'metadata'">
              {{ locale === 'ru' ? 'ОТМЕНА' : 'CANCEL' }}
            </button>
            <button class="px-6 py-3 border border-black/20 bg-white/90 shadow-sm text-[10px] font-mono uppercase tracking-widest hover:border-black/50 hover:bg-white transition-colors"
                    @click="saveDraftAndExit">
              {{ locale === 'ru' ? 'СОХРАНИТЬ ЧЕРНОВИК' : 'SAVE DRAFT' }}
            </button>
            <button class="px-8 py-3 border border-black/20 bg-black text-white shadow-sm text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-black/80 transition-colors"
                    @click="publishArticle">
              {{ locale === 'ru' ? 'ОПУБЛИКОВАТЬ' : 'PUBLISH' }}
            </button>
          </div>
          <ExForumDrawingPanel :drawing="drawing" />
        </div>
        
      </Transition>
    </div>

    <!-- JOURNAL VIEW: Front Page & Archive -->
    <div v-else class="flex flex-col min-h-full px-4 md:px-6 xl:px-8" :key="`page-${currentPage}`">
      
      <!-- Masthead -->
      <header
        class="border-b-4 border-double border-current/20 flex flex-col items-center px-8 relative z-10"
        :class="currentPage === 1 ? 'pt-8 pb-4 space-y-4' : 'pt-3 pb-4'"
      >
        <template v-if="currentPage === 1">
          <div class="flex items-center justify-between w-full text-[8px] font-mono tracking-[0.6em] opacity-40 uppercase">
            <span>{{ journalLabels.volume }}</span>
            <span class="text-[10px] tracking-[1em] italic font-serif">{{ journalLabels.edition }}</span>
            <span>{{ journalLabels.datePrefix }} {{ formatJournalDate() }}</span>
          </div>

          <h1 class="text-6xl font-serif italic tracking-tighter text-current opacity-90 text-center px-6 py-6 drop-shadow-sm cursor-pointer" @click="navigateToPage(1)">
            The Eve's Apple
          </h1>
        </template>

        <div class="journal-masthead-tools flex flex-wrap lg:flex-nowrap items-center justify-between w-full border-t border-current/10 pt-4 px-4 gap-4">
          <!-- Filters (Left) -->
          <div class="journal-filter-list flex items-center space-x-2 flex-1 justify-start">
            <button
              v-for="filter in journalFilters"
              :key="filter.mode"
              class="journal-filter-button"
              :class="{ 'is-active': activeJournalFilter === filter.mode }"
              type="button"
              @click="setJournalFilter(filter.mode)"
            >
              {{ filter.label }}
            </button>
          </div>

          <!-- Search Bar (Center) -->
          <div class="flex-1 flex justify-center">
            <label class="journal-search-shell group/search flex items-center gap-2" for="journal-search">
              <svg class="w-3.5 h-3.5 text-current/40 group-focus-within/search:text-current/80 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                id="journal-search"
                v-model="searchQuery"
                type="search"
                :placeholder="journalLabels.searchPlaceholder"
                class="journal-search-input"
              />
            </label>
          </div>

          <!-- Create Article Button (Right) -->
          <div class="flex-1 flex justify-end items-center">
            <button
              v-if="hasDraft && !isCreatingArticle"
              class="flex items-center space-x-2 px-4 py-2 mr-4 border border-black bg-black text-white hover:bg-black/80 transition-all text-[9px] font-mono tracking-widest uppercase rounded-sm shadow-md"
              @click="loadDraft"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>{{ locale === 'ru' ? 'ПРОДОЛЖИТЬ ЧЕРНОВИК' : 'CONTINUE DRAFT' }}</span>
            </button>
            <button
              class="flex items-center space-x-2 px-4 py-2 border border-current/20 hover:border-current/40 hover:bg-current/5 transition-all text-[9px] font-mono tracking-widest uppercase rounded-sm text-current/70 hover:text-current/90"
              @click="isCreatingArticle = !isCreatingArticle"
            >
              <svg v-if="!isCreatingArticle" class="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              <svg v-else class="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
              <span>{{ isCreatingArticle ? (locale === 'ru' ? 'Отмена' : 'Cancel') : (locale === 'ru' ? 'Создать статью' : 'Create Article') }}</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Journal Body -->
      <div class="flex-grow relative z-10 pb-0">
        
        <!-- DYNAMIC MAGAZINE LAYOUT -->
        <div v-if="pagedNodes.length > 0" class="flex flex-col">
          <!-- SECTION 1: Top Row (Lead Analysis + Signal Sidebar) -->
          <div class="grid grid-cols-12 border-b-[2px] border-solid border-current/20">
            <section
              v-if="pagedAnalysis.length > 0"
              class="journal-sector px-12 pb-12 pt-6"
              :class="[pagedSignals.length > 0 ? 'col-span-12 lg:col-span-8 lg:border-r-[2px] border-solid border-current/20' : 'col-span-12']"
            >
              <div class="flex flex-col space-y-12">
                <div class="flex items-center justify-between pb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                    <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">{{ journalLabels.analysis }}</h2>
                  </div>
                  <span v-if="currentPage > 1" class="text-[9px] font-mono opacity-20 uppercase tracking-widest">{{ journalLabels.editionPrefix }}{{ currentPage }}</span>
                </div>
                <ExJournalSpotlight v-if="pagedAnalysis[0]" :node="pagedAnalysis[0]" @click="navigateToNode(pagedAnalysis[0].id)" />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                  <ExNodeCard v-for="node in pagedAnalysis.slice(1, 3)" :key="node.id" :node="node" />
                </div>
              </div>
            </section>
            
            <section
              v-if="pagedSignals.length > 0"
              class="journal-sector px-8 pb-8 pt-6"
              :class="[pagedAnalysis.length > 0 ? 'col-span-12 lg:col-span-4' : 'col-span-12']"
            >
              <div class="space-y-4">
                 <div class="flex items-center space-x-3 pb-2">
                   <div class="w-1 h-1 bg-current opacity-20"></div>
                   <h2 class="text-xs font-mono tracking-[0.3em] uppercase opacity-50">{{ journalLabels.signals }}</h2>
                </div>
                <div class="space-y-1">
                  <ExNodeCard
                    v-for="node in pagedSignals.slice(0, 4)"
                    :key="node.id"
                    :node="node"
                    class="journal-signal-card"
                  />
                </div>
              </div>
            </section>
          </div>

          <!-- SECTION 2: Middle Horizontal (Research) -->
          <section v-if="pagedResearch.length > 0" class="journal-sector p-12 border-b-[2px] border-solid border-current/20">
            <div class="flex flex-col space-y-12">
              <div class="flex items-center justify-between pb-4">
                <div class="flex items-center space-x-3">
                  <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                  <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">{{ journalLabels.research }}</h2>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                <ExNodeCard v-for="node in pagedResearch.slice(0, 3)" :key="node.id" :node="node" />
              </div>
            </div>
          </section>

          <!-- SECTION 3: Bottom Strip (Strategy) -->
          <section v-if="pagedStrategies.length > 0" class="journal-sector p-12">
            <div class="flex flex-col space-y-12">
              <div class="flex items-center justify-between pb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                    <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">{{ journalLabels.strategy }}</h2>
                  </div>
              </div>
              <div class="flex overflow-x-auto space-x-12 scroll-minimal pb-4">
                <div v-for="node in pagedStrategies.slice(0, 3)" :key="node.id" class="min-w-[400px]">
                  <ExNodeCard :node="node" class="!border-none" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- NO CONTENT WARNING: The Reification Void -->
        <div v-else class="flex flex-col items-center justify-center py-48 px-12 space-y-8 animate-pulse text-center">
            <div class="text-4xl font-serif italic tracking-tighter opacity-20">
               {{ journalLabels.emptyTitle }}
            </div>
            <div class="w-12 h-px bg-current opacity-10"></div>
            <p class="max-w-md text-[10px] font-mono tracking-[0.3em] uppercase opacity-30 leading-loose">
               {{ journalLabels.emptyDescription }}
            </p>
            <button @click="navigateToPage(1)" class="mt-8 text-[9px] font-mono tracking-[0.4em] uppercase border border-current/20 px-8 py-3 hover:bg-current/5 transition-all">
               {{ journalLabels.returnToOrigin }}
            </button>
        </div>

        <!-- Pagination Controls -->
        <div class="p-12 flex flex-col items-center space-y-8 border-t border-current/10 mt-12">
           <div class="flex items-center space-x-12">
              <button v-if="currentPage > 1" @click="navigateToPage(currentPage - 1)" 
                      class="px-8 py-3 border border-current/10 text-[9px] font-mono tracking-[0.4em] uppercase opacity-40 hover:opacity-100 hover:bg-current/[0.02] transition-all">
                {{ journalLabels.previousPage }}
              </button>
              <button @click="navigateToPage(currentPage + 1)" 
                      class="px-8 py-3 bg-zinc-800 text-white text-[9px] font-mono tracking-[0.4em] uppercase hover:shadow-[0_0_30px_rgba(var(--text-primary-rgb),0.1)] transition-all">
                {{ journalLabels.nextPage }} // {{ journalLabels.archivePrefix }}0{{ currentPage + 1 }} ]
              </button>
           </div>
           
           <div class="text-[7px] font-mono opacity-20 uppercase tracking-[0.8em]">{{ journalLabels.endOfArchive }}</div>
        </div>

        <!-- Journal Footer -->
        <footer class="py-4 text-center opacity-10 hover:opacity-100 transition-opacity duration-700">
          <div class="flex flex-col items-center space-y-4">
            <div class="text-[10px] font-serif italic tracking-widest text-current">{{ journalLabels.footerQuote }}</div>
            <div class="w-24 h-px bg-current/20 mx-auto text-current"></div>
            <div class="text-[7px] font-mono tracking-[0.8em] uppercase text-current">{{ journalLabels.footerBrand }}</div>
          </div>
        </footer>

      </div>
    </div>
    </Transition>

    <!-- NODE CONTEXT MENU Overlay -->
    <Teleport to="body">
      <Transition name="fade-slide">
        <div v-if="nodeContextMenu" 
             class="fixed z-[100000000] pointer-events-auto"
             :style="{ left: nodeContextMenu.x + 'px', top: nodeContextMenu.y + 'px' }"
             @pointerdown.stop
             @contextmenu.prevent.stop>
            
            <div class="flex flex-col space-y-1.5">
              <div class="w-2 h-2 bg-black rotate-45 absolute -left-1 -top-1 animate-pulse"></div>

              <div class="group relative pt-2">
                 <button @click="removeBoardNode(nodeContextMenu.nodeId)"
                         class="bg-white border border-red-500/30 px-6 py-3 min-w-[180px] text-left transition-all duration-500 hover:border-red-500 hover:bg-red-500/10 hover:translate-x-4 flex items-center justify-between relative overflow-hidden shadow-[10px_10px_0_rgba(0,0,0,0.1)] text-[#2c2c2a]">
                   <span class="text-[9px] font-mono tracking-[0.5em] uppercase font-black text-red-500 group-hover:text-red-400">REMOVE_NODE</span>
                   <span class="text-[7px] font-mono text-red-500 opacity-40">[DEL]</span>
                   <div class="absolute inset-y-0 left-0 w-0 bg-red-500 group-hover:w-1.5 transition-all duration-500"></div>
                 </button>
                 <div class="absolute -bottom-4 left-6 opacity-0 group-hover:opacity-40 transition-all duration-500 pointer-events-none">
                  <span class="text-[7px] font-mono uppercase tracking-[0.3em] text-red-500">Warning: Permanent_Archive_Erasure</span>
                </div>
              </div>
            </div>
        </div>
      </Transition>
    </Teleport>

    <!-- BOTTOM TEXT EDITOR PANEL (Matrix Style) -->
      <Transition name="fade-slide">
        <div v-if="selectedBoardNodeId && selectedBoardNode?.type === 'text'"
             class="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100000] flex flex-col items-center w-full max-w-3xl bg-white/90 backdrop-blur-md border border-black/10 shadow-[0_20px_40px_rgba(0,0,0,0.08)] pointer-events-auto text-[#2c2c2a] transition-colors duration-500"
             @pointerdown.stop
             @contextmenu.prevent.stop>
             
          <!-- Accent corners -->
          <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black opacity-30"></div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black opacity-30"></div>

          <!-- Content -->
          <div class="w-full flex justify-center py-4">
            <div class="flex flex-wrap items-center justify-center gap-4 px-4 w-full">
              <div class="flex items-center border border-black/10">
                <button @mousedown.stop.prevent="applyTextCommand('bold')"
                        class="h-9 w-11 flex items-center justify-center font-mono text-[13px] font-black opacity-60 hover:opacity-100 hover:bg-black/5 transition-all">B</button>
                <button @mousedown.stop.prevent="applyTextCommand('italic')"
                        class="h-9 w-11 border-l border-black/10 flex items-center justify-center font-serif italic text-[15px] opacity-60 hover:opacity-100 hover:bg-black/5 transition-all">I</button>
                <button @mousedown.stop.prevent="applyTextCommand('underline')"
                        class="h-9 w-11 border-l border-black/10 flex items-center justify-center font-mono text-[13px] underline opacity-60 hover:opacity-100 hover:bg-black/5 transition-all">U</button>
              </div>

              <div class="flex items-center border border-black/10">
                <button @mousedown.stop.prevent="applyTextCommand('insertUnorderedList')"
                        class="h-9 w-11 flex items-center justify-center font-mono text-[13px] font-black opacity-60 hover:opacity-100 hover:bg-black/5 transition-all">•</button>
                <button @mousedown.stop.prevent="applyTextBlock('quote')"
                        class="h-9 w-11 border-l border-black/10 flex items-center justify-center font-serif text-[18px] opacity-60 hover:opacity-100 hover:bg-black/5 transition-all">“</button>
              </div>

              <label class="h-9 w-11 border border-black/10 flex items-center justify-center cursor-pointer relative overflow-hidden hover:bg-black/5">
                <span class="w-5 h-5 border border-black/10"
                      :style="{ backgroundColor: activeTextColor }"></span>
                <input :value="activeTextColor === 'currentColor' ? '#ffffff' : activeTextColor"
                       type="color"
                       class="absolute inset-0 opacity-0 cursor-pointer"
                       @mousedown.stop
                       @input="applyTextColor($event)" />
              </label>
              <button @mousedown.stop.prevent="resetTextColor"
                      class="h-9 w-11 border border-black/10 flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-black/5 transition-all"
                      aria-label="Default text color">
                <span class="w-5 h-5 border border-black/10 bg-white relative">
                  <span class="absolute left-1/2 top-[-3px] h-[26px] w-px bg-red-500 rotate-45 origin-center"></span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForumDrawing } from '../model/useForumDrawing'
import { useBoardDrawing } from '../model/useBoardDrawing'
import ExForumDrawingPanel from './ExForumDrawingPanel.vue'
import { useThemeStore } from '~/features/store/useTheme'
import { useI18n } from '~/shared/i18n/useI18n'
import { useAuthStore } from '~/entities/user/auth.store'
import { mockExNodes } from '~/entities/exnode/model/exnode.mock'
import { mockComments } from '~/entities/comment/mock/comment.mock'
import { mockJournalArticles, mockJournalArticle } from '~/entities/journal-article/mock/journal-article.mock'
import type { Comment } from '~/entities/comment/types/comment.types'
import type { JournalArticleBoardNode } from '~/entities/journal-article/types/journal-article.types'
import ExNodeCard from '~/entities/exnode/ui/ExNodeCard.vue'
import ExJournalSpotlight from '~/widgets/exforum/ui/ExJournalSpotlight.vue'
import ExPanel from '~/shared/ui/ExPanel.vue'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const themeStore = useThemeStore()
const authStore = useAuthStore()

// Archival State
const searchQuery = ref('')
const journalLabels = computed(() => locale.value === 'ru'
  ? {
      volume: 'Том XXIV // № 12',
      edition: 'Издание Реализации',
      datePrefix: 'Опубликовано',
      search: 'Поиск',
      searchPlaceholder: 'ПОИСК В АРХИВЕ',
      signals: 'Сигналы',
      research: 'Исследования',
      strategy: 'Стратегии',
      analysis: 'Аналитика',
      editionPrefix: 'Выпуск_0',
      emptyTitle: 'Пустота архива',
      emptyDescription: 'Внимание: вы достигли края индексированного архива. Для этой позиции нет тактических данных или публикаций.',
      returnToOrigin: '[ Вернуться_к_началу ]',
      previousPage: '[ ПРЕДЫДУЩАЯ_СТРАНИЦА ]',
      nextPage: '[ СЛЕДУЮЩАЯ_СТРАНИЦА',
      archivePrefix: 'АРХ_',
      endOfArchive: 'Конец индексированного архива',
      footerQuote: '"Знание реализовано. Ценность извлечена."',
      footerBrand: 'The Eve\'s Apple // Распределенный центр аналитики'
    }
  : {
      volume: 'Vol. XXIV // No. 12',
      edition: 'Reification Edition',
      datePrefix: 'Reified on',
      search: 'Search',
      searchPlaceholder: 'INDEX REIFICATION',
      signals: 'Signals',
      research: 'Research',
      strategy: 'Strategy',
      analysis: 'Analysis',
      editionPrefix: 'Edition_0',
      emptyTitle: 'The Reification Void',
      emptyDescription: 'Caution: You have reached the edge of the indexed registry. No tactical intelligence or archival nodes have been reified at this temporal coordinate.',
      returnToOrigin: '[ Return_to_Origin ]',
      previousPage: '[ PREV_PAGE ]',
      nextPage: '[ NEXT_PAGE',
      archivePrefix: 'ARV_',
      endOfArchive: 'End of Indexed Reification',
      footerQuote: '"Knowledge Reified. Value Extracted."',
      footerBrand: 'The Eve\'s Apple // Distributed Intel Hub'
    })
const journalFilters = computed(() => locale.value === 'ru'
  ? [
      { label: 'СИГНАЛЫ', mode: 'SETUP' },
      { label: 'ИССЛЕДОВАНИЯ', mode: 'RESEARCH' },
      { label: 'СТРАТЕГИИ', mode: 'LESSON' },
      { label: 'АНАЛИТИКА', mode: 'QUESTION' }
    ]
  : [
      { label: 'SIGNALS', mode: 'SETUP' },
      { label: 'RESEARCH', mode: 'RESEARCH' },
      { label: 'STRATEGY', mode: 'LESSON' },
      { label: 'ANALYSIS', mode: 'QUESTION' }
    ])
const activeJournalFilter = ref<string | null>(null)
const isForumLightTheme = computed(() => !themeStore.settings.isDark)
const showForumEdgeShadows = computed(() => themeStore.settings.isDark)
const articleLabels = computed(() => locale.value === 'ru'
  ? {
      returnToJournal: 'Вернуться в журнал',
      fullscreenBoard: 'Полноэкранная доска статьи',
      metrics: 'Метрики статьи',
      board: 'Доска статьи',
      openBoard: 'Открыть доску',
      comments: 'Комментарии',
      published: 'Опубликовано',
      newComment: 'Новый комментарий',
      leaveComment: 'Оставить комментарий',
      signInRequired: 'Требуется войти',
      commentingAs: 'Автор комментария',
      writeComment: 'Напишите комментарий...',
      signInToComment: 'Войдите, чтобы оставить комментарий.',
      postComment: 'Опубликовать комментарий',
      likes: 'лайков',
      noComments: 'Комментариев пока нет',
      leaveFullscreen: 'Покинуть полноэкранный режим'
    }
  : {
      returnToJournal: 'Return to The Journal',
      fullscreenBoard: 'Fullscreen article board',
      metrics: 'Article metrics',
      board: 'Article board',
      openBoard: 'Open Board',
      comments: 'Comments',
      published: 'Published',
      newComment: 'New comment',
      leaveComment: 'Leave a comment',
      signInRequired: 'Sign in required',
      commentingAs: 'Commenting as',
      writeComment: 'Write a comment...',
      signInToComment: 'Sign in to join the discussion.',
      postComment: 'Post comment',
      likes: 'Likes',
      noComments: 'No comments yet.',
      leaveFullscreen: 'Leave fullscreen mode'
    })
const formatJournalDate = () => new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US').format(new Date())
const fullscreenExitLabel = computed(() => articleLabels.value.leaveFullscreen)

const getMetricLabel = (label: string) => {
  if (locale.value !== 'ru') return label

  return {
    Likes: 'Лайки',
    Comments: 'Комментарии'
  }[label] || label
}

// Pagination Logic
const currentPage = computed(() => Number(route.query.page) || 1)
const nodesPerPage = 12

const filteredNodes = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return mockExNodes.filter((n: any) => {
    const matchesFilter = !activeJournalFilter.value || n.mode === activeJournalFilter.value
    const matchesSearch = !q
      || n.title.toLowerCase().includes(q)
      || n.thesis_brief?.toLowerCase().includes(q)
      || n.category.toLowerCase().includes(q)
      || n.signal?.asset.toLowerCase().includes(q)
      || n.signal?.description.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })
})

const pagedNodes = computed(() => {
  const start = (currentPage.value - 1) * nodesPerPage
  return filteredNodes.value.slice(start, start + nodesPerPage)
})

const pagedSignals = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'SETUP'))
const pagedResearch = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'RESEARCH'))
const pagedStrategies = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'LESSON'))
const pagedAnalysis = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'QUESTION'))

const navigateToPage = (page: number) => {
  const query = { ...route.query, page: page === 1 ? undefined : page.toString() }
  router.replace({ query })
}

const setJournalFilter = (mode: string) => {
  activeJournalFilter.value = activeJournalFilter.value === mode ? null : mode
  navigateToPage(1)
}

// Reader Logic
const selectedNodeId = computed(() => route.query.nodeId as string | undefined)
const selectedNode = computed(() => mockExNodes.find((n: any) => n.id === selectedNodeId.value))
const selectedArticle = computed(() => {
  if (!selectedNode.value) return undefined
  return mockJournalArticles.find(article => article.sourceNodeId === selectedNode.value?.id) || mockJournalArticle
})
const comments = ref<Comment[]>(mockComments.map(comment => ({ ...comment })))
const commentDraft = ref('')
const commentInputRef = ref<HTMLTextAreaElement | null>(null)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUserName = computed(() => authStore.user?.displayName?.trim() || authStore.user?.email?.trim() || 'Authenticated user')
const articleComments = computed(() => {
  return comments.value.filter(comment => comment.articleId === selectedArticle.value?.id && comment.status === 'published')
})
const journalWrapperRef = ref<HTMLElement | null>(null)
const boardViewportRef = ref<HTMLElement | null>(null)
const boardStageRef = ref<HTMLElement | null>(null)
const boardWorldRef = ref<HTMLElement | null>(null)
const boardDrawingCanvasRef = ref<HTMLCanvasElement | null>(null)
const boardNodes = ref<JournalArticleBoardNode[]>([])
const boardStrokes = ref<any[]>([])
const boardPan = ref({ x: 48, y: 36 })
const boardScale = ref(1)
const isBoardFullscreen = ref(false)
const boardFullscreenViewportStyle = ref<Record<string, string>>({})

// Article Creation State
const isCreatingArticle = ref(false)
const creationStep = ref<'metadata' | 'board'>('metadata')
const drawing = useForumDrawing()
const boardDrawing = useBoardDrawing()

const DRAFT_STORAGE_KEY = 'exforum_draft'
const hasDraft = ref(false)
if (typeof localStorage !== 'undefined') {
  hasDraft.value = !!localStorage.getItem(DRAFT_STORAGE_KEY)
}

const newArticleForm = ref({
  title: '',
  description: '',
  type: ''
})

const loadDraft = () => {
  const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY)
  if (draftStr) {
    try {
      const draft = JSON.parse(draftStr)
      newArticleForm.value = draft.form
      boardNodes.value = draft.nodes
      boardStrokes.value = draft.strokes || []
      creationStep.value = draft.step || 'metadata'
      hasDraft.value = true
      isCreatingArticle.value = true
    } catch(e) {}
  }
}

const clearDraft = () => {
  stopBoardDrawingMode()
  localStorage.removeItem(DRAFT_STORAGE_KEY)
  hasDraft.value = false
  newArticleForm.value = { title: '', description: '', type: '' }
  boardNodes.value = []
  boardStrokes.value = []
  creationStep.value = 'metadata'
}

const saveDraftAndExit = () => {
  stopBoardDrawingMode()
  isCreatingArticle.value = false
}

watch(isCreatingArticle, (newVal) => {
  if (!newVal) {
    stopBoardDrawingMode()
    creationStep.value = 'metadata'
  }
})

watch(creationStep, (step) => {
  if (step === 'board') {
    renderBoardDrawingCanvas()
  }
})

let draftSaveTimer: number | null = null

const persistDraft = () => {
  if (isCreatingArticle.value) {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      form: newArticleForm.value,
      nodes: JSON.parse(JSON.stringify(boardNodes.value)),
      strokes: JSON.parse(JSON.stringify(boardStrokes.value)),
      step: creationStep.value
    }))
    hasDraft.value = true
  }
}

watch([newArticleForm, boardNodes, boardStrokes, creationStep], () => {
  if (!isCreatingArticle.value) return
  if (draftSaveTimer) window.clearTimeout(draftSaveTimer)
  draftSaveTimer = window.setTimeout(persistDraft, 250)
}, { deep: true })

const isDropdownOpen = ref(false)
const isSubmittingArticle = ref(false)

const articleTypes = computed(() => [
  { value: 'SETUP', label: locale.value === 'ru' ? 'Сетап (SETUP)' : 'Setup' },
  { value: 'RESEARCH', label: locale.value === 'ru' ? 'Исследование (RESEARCH)' : 'Research' },
  { value: 'LESSON', label: locale.value === 'ru' ? 'Урок (LESSON)' : 'Lesson' },
  { value: 'QUESTION', label: locale.value === 'ru' ? 'Вопрос (QUESTION)' : 'Question' }
])

const selectedTypeLabel = computed(() => {
  const t = articleTypes.value.find(t => t.value === newArticleForm.value.type)
  return t ? t.label : ''
})

const isNewArticleFormValid = computed(() => {
  return newArticleForm.value.title.trim() !== '' &&
         newArticleForm.value.description.trim() !== '' &&
         newArticleForm.value.type !== ''
})

const submitNewArticle = () => {
  if (!isNewArticleFormValid.value) return
  isSubmittingArticle.value = true
  
  // Animation duration matches the 700ms in CSS, user asked to not add actual saving logic yet
  setTimeout(() => {
    isSubmittingArticle.value = false
    creationStep.value = 'board'
    boardNodes.value = []
    boardStrokes.value = []
    boardPan.value = { x: 48, y: 36 }
    boardScale.value = 1
  }, 1000)
}

const publishArticle = () => {
  console.log('Publishing article...', newArticleForm.value, boardNodes.value)
  clearDraft()
  isCreatingArticle.value = false
}

// Node Context Menu Logic
const nodeContextMenu = ref<{ x: number, y: number, nodeId: string } | null>(null)

const handleNodeContextMenu = (e: MouseEvent, nodeId: string) => {
  nodeContextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    nodeId
  }
}

const closeNodeContextMenu = () => {
  nodeContextMenu.value = null
}

const removeBoardNode = (nodeId: string) => {
  boardNodes.value = boardNodes.value.filter(n => n.id !== nodeId)
  if (selectedBoardNodeId.value === nodeId) selectedBoardNodeId.value = null
  closeNodeContextMenu()
}

// Node Selection logic
const selectedBoardNodeId = ref<string | null>(null)
const selectedBoardNode = computed(() => boardNodes.value.find((n: any) => n.id === selectedBoardNodeId.value) || null)
const activeEditorField = ref<'title' | 'text' | null>(null)
const boardTextPlaceholder = computed(() => locale.value === 'ru' ? 'Введите текст...' : 'Enter text...')

const getPlainEditorText = (value: string) => {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

const isTextNodeTitleEmpty = (node: any) => {
  return node?.type === 'text' && getPlainEditorText(node.title || '') === ''
}

const isTextNodeBodyEmpty = (node: any) => {
  return node?.type === 'text' && getPlainEditorText(node.text || '') === ''
}

// --- Text Formatting Logic ---
const activeTextColor = ref('currentColor')
const textEditorRefs = ref<Record<string, HTMLElement>>({})
const titleEditorRefs = ref<Record<string, HTMLElement>>({})

const setTitleEditorRef = (el: any, id: string) => {
  if (el) {
    titleEditorRefs.value[id] = el
    const node = boardNodes.value.find(n => n.id === id)
    const nodeTitle = (node?.type === 'text' ? node.title : '') || ''
    if (el.innerHTML !== nodeTitle) {
      el.innerHTML = nodeTitle
    }
  }
}

const updateNodeTitle = (event: Event, node: any) => {
  if (node.type === 'text') {
    const editor = event.target as HTMLElement
    node.title = getPlainEditorText(editor.innerHTML) === '' ? '' : editor.innerHTML
    if (node.title === '' && editor.innerHTML !== '') editor.innerHTML = ''
  }
}

const setTextEditorRef = (el: any, id: string) => {
  if (el) {
    textEditorRefs.value[id] = el
    const node = boardNodes.value.find(n => n.id === id)
    const nodeText = (node?.type === 'text' ? node.text : '') || ''
    if (el.innerHTML !== nodeText) {
      el.innerHTML = nodeText
    }
  }
}

const updateNodeText = (event: Event, node: any) => {
  node.text = (event.target as HTMLElement).innerHTML
}

function getActiveTextEditor() {
  if (!selectedBoardNodeId.value) return null
  if (activeEditorField.value === 'title') {
    return document.querySelector(`[data-title-node-id="${selectedBoardNodeId.value}"]`) as HTMLElement | null
  } else {
    return document.querySelector(`[data-text-node-id="${selectedBoardNodeId.value}"]`) as HTMLElement | null
  }
}

const savedTextSelection = ref<Range | null>(null)

function saveTextSelection() {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return
  const range = selection.getRangeAt(0)
  const editor = getActiveTextEditor()
  if (!editor || !editor.contains(range.commonAncestorContainer)) return
  savedTextSelection.value = range.cloneRange()
}

function restoreTextSelection() {
  const editor = getActiveTextEditor()
  if (!editor) return
  editor.focus()
  const selection = window.getSelection()
  if (!selection) return
  selection.removeAllRanges()
  if (savedTextSelection.value) {
    selection.addRange(savedTextSelection.value)
  }
}

function syncActiveTextHtml() {
  const node = selectedBoardNode.value
  const editor = getActiveTextEditor()
  if (!node || !editor) return
  if (node.type === 'text') {
    if (activeEditorField.value === 'title') {
      node.title = editor.innerHTML
    } else {
      node.text = editor.innerHTML
    }
  }
}

function applyTextCommand(command: string, value?: string) {
  if (!selectedBoardNode.value) return
  restoreTextSelection()
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand(command, false, value)
  syncActiveTextHtml()
  saveTextSelection()
}

function applyTextBlock(preset: string) {
  if (preset === 'quote') {
    applyTextCommand('formatBlock', 'blockquote')
  }
}

function applyTextColor(event?: Event) {
  activeTextColor.value = (event?.target as HTMLInputElement | undefined)?.value || activeTextColor.value
  applyTextCommand('foreColor', activeTextColor.value)
}

function resetTextColor() {
  activeTextColor.value = 'currentColor'
  applyTextCommand('foreColor', '#000000')
}

onMounted(() => {
  window.addEventListener('pointerdown', closeNodeContextMenu)
  document.addEventListener('selectionchange', saveTextSelection)
  window.addEventListener('keydown', handleSpaceDown)
  window.addEventListener('keyup', handleSpaceUp)
})

onUnmounted(() => {
  window.removeEventListener('pointerdown', closeNodeContextMenu)
  document.removeEventListener('selectionchange', saveTextSelection)
  window.removeEventListener('keydown', handleSpaceDown)
  window.removeEventListener('keyup', handleSpaceUp)
})

// v-click-outside directive logic setup inside component (or via vueuse if available, 
// but since we are in a single file, a simple window event listener is better for the dropdown, 
// but we'll use a standard workaround if v-click-outside isn't registered globally. Let's assume it might not be. 
// Wait, I used v-click-outside in the template, I should replace it with a simple @click.away or similar if it's not available.
// Actually VueUse `onClickOutside` is safer. Let's just use a transparent overlay for the dropdown instead to be safe.)

type BoardInteraction = 
  | { type: 'pan'; startClientX: number; startClientY: number; startPanX: number; startPanY: number }
  | { type: 'moveNode'; node: any; startClientX: number; startClientY: number; startNodeX: number; startNodeY: number }
  | { type: 'resizeNode'; node: any; startClientX: number; startClientY: number; startNodeW: number; startNodeH: number }

const activeBoardInteraction = ref<BoardInteraction | null>(null)
const activeBoardTool = ref<'text' | 'image' | 'drawing' | 'pencil' | null>(null)

watch(activeBoardTool, (tool, previousTool) => {
  if (previousTool === 'pencil' && tool !== 'pencil') {
    stopBoardDrawingMode()
  }

  if (tool === 'pencil') {
    selectedBoardNodeId.value = null
    activeEditorField.value = null
    closeNodeContextMenu()
    window.getSelection()?.removeAllRanges()
  }
})

const triggerImageUpload = (nodeId: string) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (re) => {
        const url = re.target?.result as string
        const node = boardNodes.value.find((n: any) => n.id === nodeId)
        if (node && node.type === 'image') {
          node.src = url
          const img = new Image()
          img.onload = () => {
            const aspect = img.width / img.height
            node.size.height = Math.max(1, Math.round(node.size.width / aspect))
          }
          img.src = url
        }
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}
const boardPointerPos = ref({ x: 0, y: 0 })
const boardGridSize = computed(() => selectedArticle.value?.board.gridSize || 28)
const boardUnitSize = computed(() => selectedArticle.value?.board.size || { width: 72, height: 44 })
const boardBaseWorldSize = computed(() => ({
  width: boardUnitSize.value.width * boardGridSize.value,
  height: boardUnitSize.value.height * boardGridSize.value
}))
const boardWorldStyle = computed(() => ({
  width: `${boardBaseWorldSize.value.width}px`,
  height: `${boardBaseWorldSize.value.height}px`
}))
const boardTransformStyle = computed(() => ({
  transform: `translate3d(${boardPan.value.x}px, ${boardPan.value.y}px, 0) scale(${boardScale.value})`,
  willChange: 'transform'
}))
const boardPreviewTransformStyle = computed(() => ({
  transform: 'translate(48px, 36px) scale(0.82)'
}))

const cloneBoardNodes = (nodes: JournalArticleBoardNode[]) => nodes.map(node => ({
  ...node,
  position: { ...node.position },
  size: { ...node.size }
})) as JournalArticleBoardNode[]

const resizeCommentInput = () => {
  const input = commentInputRef.value
  if (!input) return

  input.style.height = 'auto'
  const maxHeight = 220
  input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`
  input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden'
}

watch(selectedArticle, (article) => {
  boardNodes.value = article ? cloneBoardNodes(article.board.nodes) : []
  boardStrokes.value = article?.board.strokes ? JSON.parse(JSON.stringify(article.board.strokes)) : []
  commentDraft.value = ''
  nextTick(resizeCommentInput)
  boardPan.value = { x: 48, y: 36 }
  boardScale.value = 1
}, { immediate: true })

const submitComment = () => {
  const article = selectedArticle.value
  const user = authStore.user
  const text = commentDraft.value.trim()

  if (!article || !user || !text) return

  comments.value.unshift({
    id: `comment-${Date.now()}`,
    articleId: article.id,
    authorId: user.uid,
    authorName: currentUserName.value,
    authorRole: user.type || 'Authenticated user',
    createdAt: new Date().toISOString(),
    text,
    likesCount: 0,
    status: 'published'
  })
  commentDraft.value = ''
  nextTick(resizeCommentInput)
}

const closeReader = () => {
  closeBoardFullscreen()
  const query = { ...route.query }
  delete query.nodeId
  router.replace({ query })
}

const syncBoardFullscreenViewport = () => {
  const wrapper = journalWrapperRef.value
  if (!wrapper) return

  const rect = wrapper.getBoundingClientRect()
  boardFullscreenViewportStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  }
}

const openBoardFullscreen = () => {
  isBoardFullscreen.value = true
  syncBoardFullscreenViewport()
  boardPan.value = { x: 48, y: 36 }
  boardScale.value = 1
}

const closeBoardFullscreen = () => {
  isBoardFullscreen.value = false
  stopBoardInteraction()
}

const navigateToNode = (id: string) => {
  router.replace({
    query: {
      ...route.query,
      nodeId: id
    }
  })
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const getBoardNodeStyle = (node: JournalArticleBoardNode) => ({
  left: `${node.position.x * boardGridSize.value}px`,
  top: `${node.position.y * boardGridSize.value}px`,
  width: `${node.size.width * boardGridSize.value}px`,
  height: `${node.size.height * boardGridSize.value}px`
})

const checkNodeOverlap = (x: number, y: number, w: number, h: number, ignoreNodeId?: string) => {
  return boardNodes.value.some((node: any) => {
    if (node.id === ignoreNodeId) return false
    return (
      x < node.position.x + node.size.width &&
      x + w > node.position.x &&
      y < node.position.y + node.size.height &&
      y + h > node.position.y
    )
  })
}

const startWindowTracking = () => {
  window.addEventListener('pointermove', handleBoardPointerMove)
  window.addEventListener('pointerup', stopBoardInteraction)
  window.addEventListener('pointercancel', stopBoardInteraction)
  
  if (boardDrawing.isBoardDrawingPointerDown.value) {
     window.addEventListener('pointermove', handleGlobalBoardDrawingMove)
     window.addEventListener('pointerup', handleGlobalBoardDrawingUp)
  }
}

const stopWindowTracking = () => {
  window.removeEventListener('pointermove', handleBoardPointerMove)
  window.removeEventListener('pointerup', stopBoardInteraction)
  window.removeEventListener('pointercancel', stopBoardInteraction)
  window.removeEventListener('pointermove', handleGlobalBoardDrawingMove)
  window.removeEventListener('pointerup', handleGlobalBoardDrawingUp)
}

function stopBoardDrawingMode() {
  boardDrawing.finishBoardDrawing()
  boardDrawing.restoreNativeCursor()
  boardDrawing.isBoardDrawingCursorVisible.value = false
  stopWindowTracking()
  if (activeBoardTool.value === 'pencil') {
    activeBoardTool.value = null
  }
}

const isSpacePressed = ref(false)

const handleSpaceDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && (e.target === document.body || !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) && !(e.target as HTMLElement).isContentEditable)) {
    isSpacePressed.value = true
    if (creationStep.value === 'board') e.preventDefault()
  }
}

const handleSpaceUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false
  }
}

const handleGlobalBoardDrawingMove = (e: MouseEvent) => {
  if (activeBoardTool.value !== 'pencil' || !boardDrawing.isBoardDrawingPointerDown.value || isSpacePressed.value) return
  const elementAtPointer = document.elementFromPoint(e.clientX, e.clientY)
  if (isBoardChromeTarget(elementAtPointer)) return
  boardDrawing.moveBoardDrawing(e, boardStrokes.value)
}

const handleGlobalBoardDrawingUp = () => {
   boardDrawing.finishBoardDrawing()
   stopWindowTracking()
}

const syncBoardDrawingRefs = () => {
  boardDrawing.boardViewport.value = boardStageRef.value
  boardDrawing.boardCursorViewport.value = boardStageRef.value
  boardDrawing.boardCanvas.value = boardDrawingCanvasRef.value
  boardDrawing.boardContentSize.value = {
    width: boardBaseWorldSize.value.width,
    height: boardBaseWorldSize.value.height
  }
  boardDrawing.boardTransform.value = {
    x: boardPan.value.x,
    y: boardPan.value.y,
    scale: boardScale.value
  }
}

let boardDrawingRenderFrame: number | null = null

const renderBoardDrawingCanvas = () => {
  nextTick(() => {
    if (boardDrawingRenderFrame !== null) return
    boardDrawingRenderFrame = window.requestAnimationFrame(() => {
      boardDrawingRenderFrame = null
      syncBoardDrawingRefs()
      boardDrawing.renderBoardDrawing(boardStrokes.value)
    })
  })
}

const isBoardChromeTarget = (target: EventTarget | null) => {
  return target instanceof HTMLElement && !!target.closest('[data-board-chrome]')
}

watch([
  boardDrawingCanvasRef,
  boardStageRef,
  creationStep,
  () => boardGridSize.value,
  () => boardUnitSize.value.width,
  () => boardUnitSize.value.height,
  () => boardPan.value.x,
  () => boardPan.value.y,
  () => boardScale.value
], () => {
  if (creationStep.value === 'board') renderBoardDrawingCanvas()
}, { flush: 'post' })

const startBoardPan = (event: PointerEvent) => {
  const target = event.target as HTMLElement | null
  if (creationStep.value === 'board' && isBoardChromeTarget(target)) return
  
  if (creationStep.value === 'board' && activeBoardTool.value) {
    if (activeBoardTool.value === 'pencil' && !isSpacePressed.value) {
      syncBoardDrawingRefs()
      boardDrawing.startBoardDrawing(event, boardStrokes.value)
      startWindowTracking()
      return
    }
    
    if (!isSpacePressed.value) {
      // Click to add node
      const rect = boardWorldRef.value?.getBoundingClientRect()
      if (!rect) return
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top
      const worldX = pointerX / boardScale.value
      const worldY = pointerY / boardScale.value

      // Snap to grid
      const gridX = Math.round(worldX / boardGridSize.value)
      const gridY = Math.round(worldY / boardGridSize.value)

      // Check overlap
      const newW = activeBoardTool.value === 'text' ? 10 : (activeBoardTool.value === 'image' ? 10 : 12)
      const newH = activeBoardTool.value === 'text' ? 6 : (activeBoardTool.value === 'image' ? 10 : 12)

      if (checkNodeOverlap(gridX, gridY, newW, newH)) {
        alert(locale.value === 'ru' ? 'Недостаточно места для размещения узла!' : 'Not enough space to place node!')
        activeBoardTool.value = null
        return
      }

      if (activeBoardTool.value === 'text') {
        const newNode = {
          id: `node_${Date.now()}`,
          type: 'text',
          title: '',
          text: '',
          position: { x: gridX, y: gridY },
          size: { width: 10, height: 6 },
          isEditing: true
        }
        boardNodes.value.push(newNode as any)
      } else if (activeBoardTool.value === 'image') {
        const newNode = {
          id: `node_${Date.now()}`,
          type: 'image',
          src: '',
          alt: 'Uploaded Image',
          caption: '',
          position: { x: gridX, y: gridY },
          size: { width: 10, height: 10 }
        }
        boardNodes.value.push(newNode as any)
      } else if (activeBoardTool.value === 'drawing') {
        const newNode = {
          id: `node_${Date.now()}`,
          type: 'drawing',
          params: { strokes: [] },
          position: { x: gridX, y: gridY },
          size: { width: 12, height: 12 }
        }
        boardNodes.value.push(newNode as any)
      }

      activeBoardTool.value = null
      return
    }
  }

  const resizeHandle = target?.closest('[data-board-resize]') as HTMLElement | null
  if (resizeHandle) {
    event.preventDefault()
    const nodeId = resizeHandle.dataset.nodeId
    selectedBoardNodeId.value = nodeId || null
    const node = boardNodes.value.find((n: any) => n.id === nodeId)
    if (node) {
      activeBoardInteraction.value = {
        type: 'resizeNode',
        node,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startNodeW: node.size.width,
        startNodeH: node.size.height
      }
      startWindowTracking()
      return
    }
  }

  const nodeHandle = target?.closest('[data-board-node-handle]') as HTMLElement | null
  if (nodeHandle) {
    event.preventDefault()
    const nodeId = nodeHandle.dataset.nodeId
    selectedBoardNodeId.value = nodeId || null
    const node = boardNodes.value.find((n: any) => n.id === nodeId)
    if (node) {
      activeBoardInteraction.value = {
        type: 'moveNode',
        node,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startNodeX: node.position.x,
        startNodeY: node.position.y
      }
      startWindowTracking()
      return
    }
  }

  const clickedNodeEl = target?.closest('[data-board-node]') as HTMLElement | null
  if (clickedNodeEl) {
    const nodeId = clickedNodeEl.dataset.nodeId
    if (nodeId) selectedBoardNodeId.value = nodeId
    return
  }

  event.preventDefault()
  selectedBoardNodeId.value = null

  activeBoardInteraction.value = {
    type: 'pan',
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPanX: boardPan.value.x,
    startPanY: boardPan.value.y
  }
  startWindowTracking()
}

const handleBoardHover = (event: PointerEvent) => {
  if (creationStep.value === 'board') {
    if (isBoardChromeTarget(event.target)) {
      boardDrawing.isBoardDrawingCursorVisible.value = false
      return
    }

    if (activeBoardTool.value === 'pencil') {
      syncBoardDrawingRefs()
      boardDrawing.updateBoardDrawingCursor(event)
    }
    if (activeBoardTool.value) {
      const rect = boardWorldRef.value?.getBoundingClientRect()
      if (rect) {
        boardPointerPos.value = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
      }
    }
  }
}

const handleBoardPointerMove = (event: PointerEvent) => {
  const interaction = activeBoardInteraction.value
  if (!interaction) return

  if (interaction.type === 'pan') {
    boardPan.value = {
      x: interaction.startPanX + event.clientX - interaction.startClientX,
      y: interaction.startPanY + event.clientY - interaction.startClientY
    }
  } else if (interaction.type === 'moveNode') {
    const deltaWorldX = (event.clientX - interaction.startClientX) / boardScale.value
    const deltaWorldY = (event.clientY - interaction.startClientY) / boardScale.value
    
    // Smooth fractional position
    const freeX = interaction.startNodeX + deltaWorldX / boardGridSize.value
    const freeY = interaction.startNodeY + deltaWorldY / boardGridSize.value
    
    interaction.node.position.x = freeX
    interaction.node.position.y = freeY
  } else if (interaction.type === 'resizeNode') {
    const deltaWorldX = (event.clientX - interaction.startClientX) / boardScale.value
    const deltaWorldY = (event.clientY - interaction.startClientY) / boardScale.value
    
    // Smooth fractional size
    const freeW = interaction.startNodeW + deltaWorldX / boardGridSize.value
    const newWidth = Math.max(4, freeW)
    
    let newHeight = interaction.node.size.height
    if (interaction.node.type === 'image') {
      const aspect = interaction.startNodeW / interaction.startNodeH
      newHeight = Math.max(4, newWidth / aspect)
    } else {
      const freeH = interaction.startNodeH + deltaWorldY / boardGridSize.value
      newHeight = Math.max(4, freeH)
    }

    interaction.node.size.width = newWidth
    interaction.node.size.height = newHeight
  }
}

const stopBoardInteraction = () => {
  const interaction = activeBoardInteraction.value
  if (interaction) {
    if (interaction.type === 'moveNode') {
      // Snap to grid on drop
      const snappedX = Math.round(interaction.node.position.x)
      const snappedY = Math.round(interaction.node.position.y)
      
      // Check overlap
      if (!checkNodeOverlap(snappedX, snappedY, Math.round(interaction.node.size.width), Math.round(interaction.node.size.height), interaction.node.id)) {
        interaction.node.position.x = snappedX
        interaction.node.position.y = snappedY
      } else {
        // Revert if invalid
        interaction.node.position.x = interaction.startNodeX
        interaction.node.position.y = interaction.startNodeY
      }
    } else if (interaction.type === 'resizeNode') {
      // Snap to grid on drop
      const snappedW = Math.round(interaction.node.size.width)
      const snappedH = Math.round(interaction.node.size.height)
      
      if (!checkNodeOverlap(Math.round(interaction.node.position.x), Math.round(interaction.node.position.y), snappedW, snappedH, interaction.node.id)) {
        interaction.node.size.width = snappedW
        interaction.node.size.height = snappedH
      } else {
        // Revert if invalid
        interaction.node.size.width = interaction.startNodeW
        interaction.node.size.height = interaction.startNodeH
      }
    }
  }

  activeBoardInteraction.value = null
  stopWindowTracking()
}

const handleBoardWheel = (event: WheelEvent) => {
  const viewport = creationStep.value === 'board' ? boardStageRef.value : boardViewportRef.value
  if (!viewport) return

  const rect = viewport.getBoundingClientRect()
  const previousScale = boardScale.value
  const nextScale = clamp(previousScale - event.deltaY * 0.001, 0.45, 2.2)
  const pointerX = event.clientX - rect.left
  const pointerY = event.clientY - rect.top
  const worldX = (pointerX - boardPan.value.x) / previousScale
  const worldY = (pointerY - boardPan.value.y) / previousScale

  boardScale.value = nextScale
  boardPan.value = {
    x: pointerX - worldX * nextScale,
    y: pointerY - worldY * nextScale
  }
}

const handleBoardKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isBoardFullscreen.value) {
    closeBoardFullscreen()
  }
}

const handleWindowResize = () => {
  if (isBoardFullscreen.value) syncBoardFullscreenViewport()
  if (creationStep.value === 'board') {
    renderBoardDrawingCanvas()
  }
}

onMounted(() => {
  boardDrawing.restoreNativeCursor()
  nextTick(resizeCommentInput)
  window.addEventListener('keydown', handleBoardKeydown)
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  stopBoardDrawingMode()
  if (boardDrawingRenderFrame !== null) {
    window.cancelAnimationFrame(boardDrawingRenderFrame)
    boardDrawingRenderFrame = null
  }
  if (draftSaveTimer) {
    window.clearTimeout(draftSaveTimer)
    persistDraft()
    draftSaveTimer = null
  }
  window.removeEventListener('keydown', handleBoardKeydown)
  window.removeEventListener('resize', handleWindowResize)
})

const formatCommentDate = (value: string) => {
  return new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

// Scroll to Top Logic
watch(() => [route.query.nodeId, route.query.page], () => {
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const scrollContainers = document.querySelectorAll('.scroll-minimal, .overflow-y-auto, main, .ethereal-void')
    scrollContainers.forEach(container => {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    })
  })
}, { immediate: true })

// Sectional Intelligence Logic (Inherited by paged computed)
</script>

<style scoped>
.force-light-theme {
  --theme-bg: #FFFFFF !important;
  --theme-panel: rgba(255, 255, 255, 0.92) !important;
  --theme-text: #2c2c2a !important;
  --theme-muted: rgba(44, 44, 42, 0.58) !important;
  --theme-border: rgba(44, 44, 42, 0.12) !important;
  --theme-border-strong: rgba(44, 44, 42, 0.28) !important;
  --theme-accent: #8d7f61 !important;
  --theme-grid-dot: rgba(44, 44, 42, 0.24) !important;
  --theme-tooltip-bg: #F9F9F9 !important;
  --theme-tooltip-text: #2c2c2a !important;
  --theme-tooltip-muted: rgba(44, 44, 42, 0.62) !important;
  --theme-tooltip-border: rgba(44, 44, 42, 0.18) !important;
  --text-heading: #050505 !important;
  --text-description: rgba(18, 18, 18, 0.45) !important;
  --icon-color-mode: black !important;
  
  background-color: var(--theme-bg) !important;
  color: var(--theme-text) !important;
}

.force-light-theme.exforum-transparent-bg {
  background-color: transparent !important;
}

.force-light-theme * {
  border-color: var(--theme-border);
}
</style>

<style scoped>
.journal-wrapper {
  color: var(--text-primary);
}

.journal-wrapper.exforum-edge-shadows {
  background-attachment: local, local, local, local;
  background-image:
    radial-gradient(ellipse 120% 86% at 50% 0%, rgba(0, 0, 0, 0.11) 0%, rgba(0, 0, 0, 0.07) 28%, rgba(0, 0, 0, 0.026) 58%, rgba(0, 0, 0, 0) 82%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.07) 0%, rgba(0, 0, 0, 0.038) 34%, rgba(0, 0, 0, 0.014) 68%, rgba(0, 0, 0, 0) 100%),
    radial-gradient(ellipse 120% 86% at 50% 100%, rgba(0, 0, 0, 0.11) 0%, rgba(0, 0, 0, 0.07) 28%, rgba(0, 0, 0, 0.026) 58%, rgba(0, 0, 0, 0) 82%),
    linear-gradient(to top, rgba(0, 0, 0, 0.07) 0%, rgba(0, 0, 0, 0.038) 34%, rgba(0, 0, 0, 0.014) 68%, rgba(0, 0, 0, 0) 100%);
  background-position: top, top, bottom, bottom;
  background-repeat: no-repeat;
  background-size: 100% 260px, 100% 260px, 100% 260px, 100% 260px;
}

.journal-sector {
  position: relative;
}

:deep(.journal-signal-card) {
  border: 0 !important;
}

.journal-filter-list {
  flex-wrap: wrap;
}

.journal-filter-button {
  position: relative;
  min-height: 30px;
  border: 0;
  border-bottom: 1px solid transparent;
  padding: 7px 5px 8px;
  background: transparent;
  color: rgba(44, 44, 42, 0.52);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  line-height: 1;
  text-transform: uppercase;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.journal-filter-button:hover {
  border-bottom-color: rgba(44, 44, 42, 0.42);
  color: rgba(44, 44, 42, 0.95);
}

.journal-filter-button.is-active {
  border-bottom-color: rgba(44, 44, 42, 0.88);
  color: rgba(44, 44, 42, 0.95);
}

.journal-filter-button.is-active::after {
  position: absolute;
  bottom: -3px;
  left: 50%;
  width: 4px;
  height: 4px;
  background: rgba(44, 44, 42, 0.88);
  content: '';
  transform: translateX(-50%) rotate(45deg);
}

.journal-search-shell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  border: 0;
  border-bottom: 1px solid rgba(44, 44, 42, 0.28);
  padding: 0 2px;
  background: transparent;
  transition: border-color 0.2s ease;
}

.journal-search-shell:focus-within {
  border-bottom-color: rgba(44, 44, 42, 0.78);
}

.journal-search-label {
  flex: 0 0 auto;
  color: rgba(44, 44, 42, 0.64);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.journal-search-input {
  width: 210px;
  border: 0;
  padding: 9px 0;
  background: transparent;
  color: rgba(44, 44, 42, 0.9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  outline: none;
  text-transform: uppercase;
  transition: width 0.2s ease;
}

.journal-search-input:focus {
  width: 290px;
}

.journal-search-input::placeholder {
  color: rgba(44, 44, 42, 0.5);
  opacity: 1;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from { opacity: 0; transform: translateY(20px); filter: blur(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-20px); filter: blur(20px); }

.scroll-minimal::-webkit-scrollbar { display: none; }
.scroll-minimal { scrollbar-width: none; }

.grid-auto-flow-dense {
  grid-auto-flow: dense;
}

/* Double border for masthead authority */
.border-double {
  border-style: double;
}

.journal-article-reader {
  color: var(--text-primary);
}

.article-reader-header {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 0 clamp(20px, 4vw, 64px) 28px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 9%, transparent);
}

.article-reader-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 calc(clamp(20px, 4vw, 64px) * -1);
  padding: 24px clamp(20px, 4vw, 64px);
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  background: color-mix(in srgb, currentColor 1%, transparent);
}

.article-reader-back {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(44, 44, 42, 0.24);
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 22px rgba(44, 44, 42, 0.07);
  color: rgba(44, 44, 42, 0.7);
  transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease;
}

.article-reader-back:hover {
  border-color: rgba(44, 44, 42, 0.5);
  background: #ffffff;
  color: rgba(44, 44, 42, 1);
}

.article-reader-back span:last-child {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.article-reader-kicker {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.48em;
  text-transform: uppercase;
  opacity: 0.35;
}

.article-reader-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
  gap: clamp(28px, 5vw, 72px);
  align-items: end;
}

.article-reader-title-row h1 {
  max-width: 980px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.4rem, 5vw, 5.8rem);
  font-style: italic;
  line-height: 0.98;
  letter-spacing: 0;
  color: currentColor;
}

.article-reader-title-row p {
  max-width: 720px;
  margin-top: 22px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1rem, 1.25vw, 1.25rem);
  font-style: italic;
  line-height: 1.65;
  color: color-mix(in srgb, currentColor 54%, transparent);
}

.article-reader-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-left: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.article-reader-metric {
  min-height: 82px;
  padding: 16px 18px;
  border-right: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  background: color-mix(in srgb, currentColor 1.5%, transparent);
}

.article-reader-metric span {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  opacity: 0.35;
}

.article-reader-metric strong {
  display: block;
  margin-top: 12px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.55rem;
  font-style: italic;
  font-weight: 400;
  line-height: 1;
  color: color-mix(in srgb, currentColor 76%, transparent);
}

.article-comments-footer {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 34px clamp(20px, 4vw, 64px) 46px;
  border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent);
}

.article-comments-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.article-comments-heading span,
.article-comments-heading strong,
.article-comment span,
.article-comment-meta {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  opacity: 0.35;
}

.article-comments-heading span,
.article-comments-heading strong {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.24em;
  opacity: 0.72;
}

.article-comment-composer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 22px;
  border: 1px solid rgba(44, 44, 42, 0.24);
  border-left: 3px solid rgba(44, 44, 42, 0.72);
  background: rgba(248, 248, 246, 0.96);
  box-shadow: 0 12px 30px rgba(44, 44, 42, 0.08);
}

.article-comment-composer-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 2px;
}

.article-comment-composer-title > div > span {
  display: block;
  margin-bottom: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(44, 44, 42, 0.58);
}

.article-comment-composer-title h3 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.45rem;
  font-style: italic;
  font-weight: 400;
  line-height: 1;
  color: rgba(44, 44, 42, 0.88);
}

.article-comment-composer-status {
  flex: 0 0 auto;
  border: 1px solid rgba(44, 44, 42, 0.18);
  padding: 7px 9px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(44, 44, 42, 0.56);
}

.article-comment-composer-meta,
.article-comment-composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.article-comment-composer-meta span,
.article-comment-composer-actions span {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(44, 44, 42, 0.52);
}

.article-comment-composer-meta strong {
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: rgba(44, 44, 42, 0.8);
}

.article-comment-input {
  width: 100%;
  min-height: 42px;
  max-height: 220px;
  resize: none;
  overflow-y: hidden;
  border: 1px solid rgba(44, 44, 42, 0.24);
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.98);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.95rem;
  font-style: italic;
  line-height: 1.45;
  color: rgba(44, 44, 42, 0.9);
  box-shadow: inset 0 1px 2px rgba(44, 44, 42, 0.04);
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.article-comment-input::placeholder {
  color: rgba(44, 44, 42, 0.6);
  opacity: 1;
}

.article-comment-input:focus {
  border-color: rgba(44, 44, 42, 0.62);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(44, 44, 42, 0.08);
}

.article-comment-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.article-comment-submit {
  border: 1px solid rgba(44, 44, 42, 0.82);
  padding: 11px 15px;
  background: rgba(44, 44, 42, 0.88);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #ffffff;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.article-comment-submit:hover:not(:disabled) {
  background: rgba(44, 44, 42, 1);
}

.article-comment-submit:disabled {
  cursor: not-allowed;
  background: rgba(44, 44, 42, 0.42);
  border-color: rgba(44, 44, 42, 0.42);
  opacity: 1;
}

.article-comments-list {
  display: grid;
  gap: 12px;
}

.article-comment {
  padding: 20px 22px;
  border: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  background: color-mix(in srgb, currentColor 1.5%, transparent);
}

.article-comment-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.article-comment h3 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.25rem;
  font-style: italic;
  line-height: 1;
  color: color-mix(in srgb, currentColor 78%, transparent);
}

.article-comment span {
  display: block;
  margin-top: 8px;
}

.article-comment-meta {
  display: flex;
  gap: 18px;
  text-align: right;
  white-space: nowrap;
}

.article-comment-meta span {
  margin-top: 0;
}

.article-comment p,
.article-comments-empty {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1rem;
  font-style: italic;
  line-height: 1.65;
  color: color-mix(in srgb, currentColor 56%, transparent);
}

@media (max-width: 1023px) {
  .article-reader-title-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 639px) {
  .journal-masthead-tools {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .journal-filter-list {
    width: 100%;
  }

  .journal-search-shell,
  .journal-search-input,
  .journal-search-input:focus {
    width: 100%;
  }

  .article-reader-header {
    padding-top: 28px;
  }

  .article-reader-kicker {
    flex-wrap: wrap;
    letter-spacing: 0.32em;
  }

  .article-reader-metrics {
    grid-template-columns: 1fr;
  }

  .article-comments-heading,
  .article-comment-head,
  .article-comment-meta,
  .article-comment-composer-title,
  .article-comment-composer-meta,
  .article-comment-composer-actions {
    align-items: start;
    flex-direction: column;
    text-align: left;
    white-space: normal;
  }
}
</style>
