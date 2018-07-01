const unscrambleLength = 6;

const $dropArea = $('.ar-drop-area'), // [jqEle]
  $dragArea = $('.ar-drag-area'),
  speed = 200,
  drag = new DragPolar({
    dragItems: '.ar-label-item',
    sandboxPad: [10, 10, 10, 10],
    moveTolerant: 20,
  });

let startCord, //start cordination of the src node
  $labelsInDropArea, // labels in drop area
  /**
   * save the position which the drag label shall move to.
   * -2: back to drag area
   * -1: to drop area but touch no other labels
   * >= 0: to drop area and it's the index of label which the drag token shall append after
   */
  dropPosition, // the closest touched label index
  touchedLabels, // only include the neighbour label according to the dropPosition
  $guidePhantom,
  dragFromDrop,
  // timers
  timerReset;

// sync the height
function resizeDragArea() {
  $dropArea.css('min-height', $dragArea.innerHeight());
  $('.ar-unscramble-container').css('min-height', (($dropArea.innerHeight() * 55) / 45) * 2);
}
$(window).on('resize.unscrambleResize', function() {
  resizeDragArea();
});
resizeDragArea();

// init the drag sys
drag.init();

// evts
drag.fallout
  .on('start', function(token, srcNode, info) {
    $guidePhantom = $(srcNode)
      .parent()
      .clone();
    startCord = [info.startX, info.startY];
    dragFromDrop = $(srcNode).parents('.ar-drop-area').length;
  })
  .on('move', function(token, srcNode, info) {
    // get the position
    getDropPosition(token, srcNode);
    console.log(dropPosition);
    console.log(touchedLabels);
    // remove guide
    !dragFromDrop && isNaN(parseInt(dropPosition)) && $guidePhantom && $guidePhantom.remove();
    // situation that move into drop area but hit nothing
    if (dropPosition === -1) {
      // add guide for simply append logic if the drag item's not from drop area
      !dragFromDrop && $dropArea.append($guidePhantom);
    }
    // add guide for sort logic
    if (dropPosition >= 0) {
      let onlyOneAndLeanLeft =
        touchedLabels.length === 1 &&
        DragPolar.getTargetInfo(token).target_X - DragPolar.getTargetInfo($labelsInDropArea[dropPosition]).target_X <=
          0;
      let onlyOneAndLeanRight =
        touchedLabels.length === 1 &&
        DragPolar.getTargetInfo(token).target_X - DragPolar.getTargetInfo($labelsInDropArea[dropPosition]).target_X > 0;
      let appendMark;
      if (touchedLabels.length > 1) {
        appendMark = 1;
        dropPosition = touchedLabels[0];
      }
      // insert before
      if (onlyOneAndLeanLeft) {
        dragFromDrop &&
          $(srcNode)
            .parent()
            .insertBefore($labelsInDropArea.eq(dropPosition).parent());
        // $guidePhantom = $(srcNode).parent().clone();
        !dragFromDrop && $guidePhantom.insertBefore($labelsInDropArea.eq(dropPosition).parent());
      }
      // append after
      else if (onlyOneAndLeanRight || appendMark) {
        dragFromDrop &&
          $(srcNode)
            .parent()
            .insertAfter($labelsInDropArea.eq(dropPosition).parent());
        // $guidePhantom = $(srcNode).parent().clone();
        !dragFromDrop && $guidePhantom.insertAfter($labelsInDropArea.eq(dropPosition).parent());
      }
    }
  })
  .on('drop', function(token, srcNode) {
    // move back without changing area
    if (isNaN(parseInt(dropPosition))) {
      // drag from drag area
      !dragFromDrop &&
        DragPolar.moveItem(token, [0, 0], speed, function() {
          resetChanges(token);
          // remove code below in angular
          $(srcNode).removeAttr('style');
        });
      // drag from drop area
      dragFromDrop &&
        DragPolar.moveItem(token, getDestCordByStart(srcNode), speed, function() {
          resetChanges(token);
          // remove code below in angular
          $(srcNode).removeAttr('style');
        });
      return;
    }
    // back to drag area
    if (dropPosition === -2) {
      const attrPos = $(srcNode)
        .parent()
        .attr('attr-position');
      const $guideNode = $dragArea.find(`[attr-position='${attrPos}']`);
      DragPolar.moveItem(token, getDestCordByStart($guideNode[0]), speed, function() {
        resetChanges(token);
        // remove code below in angular
        $guideNode.children().removeAttr('style');
        $(srcNode)
          .parent()
          .remove();
      });
    }
    // guide to drop area
    if (dropPosition >= -1) {
      // drag from drag area
      !dragFromDrop &&
        DragPolar.moveItem(token, getDestCordByStart($guidePhantom[0]), speed, function() {
          resetChanges(token);
          $guidePhantom.children().removeAttr('style'); // remove this in angular
        });
      // drag from drop area
      dragFromDrop &&
        DragPolar.moveItem(token, getDestCordByStart(srcNode), speed, function() {
          resetChanges(token);
          $(srcNode).removeAttr('style'); // remove this in angular
        });
    }
  })
  .on('click', function(token, srcNode) {
    // move to drop area
    if ($(srcNode).parents('.ar-drag-area').length) {
      const $guideNode = $(srcNode)
        .parent()
        .clone();
      $dropArea.append($guideNode);
      DragPolar.moveItem(token, $guideNode[0], speed, function() {
        resetChanges(token);
        $guideNode.children().removeAttr('style'); // remove this in angular
      });
    }
    // move to drag area
    else {
      const attrPos = $(srcNode)
        .parent()
        .attr('attr-position');
      const $guideNode = $dragArea.find(`[attr-position='${attrPos}']`);
      DragPolar.moveItem(token, $guideNode[0], speed, function() {
        // remove code below in angular
        $guideNode.children().removeAttr('style');
        $(srcNode)
          .parent()
          .remove();
        resetChanges(token);
      });
    }
  });

// get dest cordinator from the drag token (if it has translate value) to guide
function getDestCordByStart(guidNode) {
  return [
    DragPolar.getTargetInfo(guidNode).target_X - startCord[0],
    DragPolar.getTargetInfo(guidNode).target_Y - startCord[1],
  ];
}

// get the drop position which the drag label shall be located to
function getDropPosition(token, srcNode) {
  // console.warn("detect") // show the time the detect fn triggered
  // check if the token's dragged into the drop area
  touchedLabels = [];
  if (DragPolar.detectTouch(token, $dropArea[0])) {
    let touchList = [];
    $labelsInDropArea = $dropArea.find('.ar-label-item');
    $labelsInDropArea.each(function(idx) {
      if (DragPolar.detectTouch(token, this)) touchList.push([DragPolar.distanceBetween(token, this), idx]);
    });
    touchList.sort(function(a, b) {
      return a[0] - b[0];
    });
    dropPosition = touchList[0] ? touchList[0][1] : -1;
    // get the touched labels Array
    touchList.forEach(function(arr) {
      Math.abs(dropPosition - arr[1]) < 2 && touchedLabels.push(arr[1]);
    });
    touchedLabels = touchedLabels.slice(0, 2);
    touchedLabels.sort(function(a, b) {
      return a - b;
    });
    // assert that hit nothing if drag from drop area and still in drop area
    dragFromDrop && dropPosition === -1 && (dropPosition = null);
  }
  // drag back to drag area
  else if (DragPolar.detectTouch(token, $dragArea[0]) && dragFromDrop) {
    dropPosition = -2;
  }
  // hit nothing
  else {
    dropPosition = null;
  }
}

function resetChanges(tar) {
  timerReset = setTimeout(function() {
    $(tar).remove();
  }, 0);
  $('.ar-label-item').removeClass('disabled');
  dropPosition = null;
}
