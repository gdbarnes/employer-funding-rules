/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production');
}

$(document).ready(function() {
  window.GOVUKFrontend.initAll();

  window.GOVUK = window.GOVUK || {};

  window.GOVUK.getCurrentLocation = function() {
    return window.location;
  };

  function Collapsible(section) {
    this.$section = section;
    this.$clickTarget = this.$section.find('.js-subsection-title');
    this.$clickTarget.on('click', this.toggle.bind(this));
    this.addToggle();

    this.$section.on(
      'focus',
      '.js-subsection-body a',
      this.showSectionWhenLinkFocused.bind(this)
    );
  }

  Collapsible.prototype.showSectionWhenLinkFocused = function() {
    if (this.$section.is('.closed')) {
      this.$section.toggleClass('closed');
    }
  };

  Collapsible.prototype.addToggle = function addToggle() {
    var $toggleHTML = $("<span class='js-toggle'></span>");
    this.$clickTarget.append($toggleHTML);
  };

  Collapsible.prototype.toggle = function toggle(event) {
    this.$section.toggleClass('closed');
    event.preventDefault();
  };

  Collapsible.prototype.close = function close() {
    this.$section.addClass('closed');
  };

  Collapsible.prototype.open = function open() {
    this.$section.removeClass('closed');
  };

  Collapsible.prototype.isClosed = function() {
    return this.$section.hasClass('closed');
  };

  GOVUK.Collapsible = Collapsible;

  function CollapsibleCollection(options) {
    this.collapsibles = {};

    this.$container = options.$el;
    var depth = this.$container.data('collapse-depth');
    if (typeof depth == 'undefined') {
      depth = 1;
    }

    this.collapseSelector = 'h' + (depth + 1);
    this.superiorsSelector = this.calculateSuperiorsSelector(depth);
    this.markupSections();
    this.$sections = this.$container.find('.js-openable');

    if (this.$sections.length > 0) {
      this.$sections.each(this.initCollapsible.bind(this));
      this.$openAll = $("<a href='#' aria-hidden=true>Open all</a>");
      this.$closeAll = $("<a href='#' aria-hidden=true>Close all</a>");
      this.addControls();

      this.closeAll();

      var anchor = GOVUK.getCurrentLocation().hash;
      if (anchor) {
        this.openCollapsibleForAnchor(anchor);
      }

      this.$container.on(
        'click',
        'a[rel="footnote"]',
        this.expandFootnotes.bind(this)
      );

      this.$container.on(
        'click',
        '.body-content-wrapper a',
        function(event) {
          if (window.location.pathname === event.target.pathname) {
            this.openCollapsibleForAnchor(event.currentTarget.hash);
          }
        }.bind(this)
      );
    }
  }

  CollapsibleCollection.prototype.initCollapsible = function initCollapsible(
    sectionIndex
  ) {
    var $section = $(this.$sections[sectionIndex]);
    var collapsible = new GOVUK.Collapsible($section);
    var sectionID = $section.find('.js-subsection-title').data('section-id');

    if (typeof sectionID == 'undefined') {
      sectionID = sectionIndex;
    }

    $section.on('click', this.updateControls.bind(this));
    this.collapsibles[sectionID] = collapsible;
  };

  CollapsibleCollection.prototype.expandFootnotes = function expandFootnotes() {
    this.collapsibles.footnotes.open();
  };

  CollapsibleCollection.prototype.markupSections = function markupSections() {
    // Pull out h2's and mark them up as js-subsection-title.
    // Mark all following tags up to the next h2 as js-subsection-body.
    // Wrap newly discovered sections in a div with js-openable and manual-subsection classes
    // The DOM now contains poperly marked up sections to which collapsible functions can attach.

    var subsectionHeaders = this.$container.find(this.collapseSelector);
    subsectionHeaders.each(function() {
      var $header = $(this);
      $header
        .addClass('js-subsection-title')
        .wrapInner('<a role="button" href="#' + $header.attr('id') + '"></a>');
    });

    subsectionHeaders.each(
      function(index, el) {
        var $subsectionHeader = $(el),
          subsectionId = $subsectionHeader.attr('id');

        if (subsectionId) {
          $subsectionHeader.data('section-id', subsectionId);
        }

        var subsectionBody = $subsectionHeader.nextUntil(
          this.superiorsSelector
        );
        subsectionBody.andSelf().wrapAll('<div class="js-openable"></div>');
        subsectionBody.wrapAll(
          '<div class="js-subsection-body body-content-wrapper"></div>'
        );
      }.bind(this)
    );
  };

  CollapsibleCollection.prototype.calculateSuperiorsSelector = function calculateSuperiorsSelector(
    depth
  ) {
    // Returns a string with this header and all the headers of higher priority, for example 'h2,h1' (depth is zero offset)

    var selector = '';
    var hValue = depth + 1;

    while (hValue > 0) {
      selector += 'h' + hValue + ',';
      hValue = hValue - 1;
    }
    selector = selector.slice(0, -1);
    return selector;
  };

  CollapsibleCollection.prototype.closeAll = function closeAll(event) {
    for (var section in this.collapsibles) {
      this.collapsibles[section].close();
    }

    this.disableControl(this.$closeAll);
    this.enableControl(this.$openAll);

    if (typeof event != 'undefined') {
      event.preventDefault();
    }
  };

  CollapsibleCollection.prototype.openAll = function openAll(event) {
    for (var section in this.collapsibles) {
      this.collapsibles[section].open();
    }

    this.disableControl(this.$openAll);
    this.enableControl(this.$closeAll);

    if (typeof event != 'undefined') {
      event.preventDefault();
    }
  };

  CollapsibleCollection.prototype.addControls = function addControls() {
    var $collectionControlsWrap = $('<div class="js-title-controls-wrap"/>');
    var $collectionControls = $('<div class="js-collection-controls" />');
    $collectionControls.append(this.$openAll, this.$closeAll);
    $collectionControlsWrap.append($collectionControls);

    // The Updates pages have a title for each collapsible section (they're sorted by year), include this if it's there
    var $title = this.$container.find($('.section-title'));
    if ($title.length) {
      $collectionControlsWrap.prepend($title);
    }

    this.$container.prepend($collectionControlsWrap);
    this.$openAll.on('click', this.openAll.bind(this));
    this.$closeAll.on('click', this.closeAll.bind(this));
  };

  CollapsibleCollection.prototype.updateControls = function updateControls() {
    // if all the sections in this collection are open
    var sectionCount = this.$sections.length;
    var closedCount = this.$container.find('.closed').length;

    if (closedCount === 0) {
      // all the sections are open
      this.disableControl(this.$openAll);
      this.enableControl(this.$closeAll);
    } else if (sectionCount == closedCount) {
      // all the sections are closed
      this.disableControl(this.$closeAll);
      this.enableControl(this.$openAll);
    } else {
      this.enableControl(this.$openAll);
      this.enableControl(this.$closeAll);
    }
  };

  CollapsibleCollection.prototype.disableControl = function disableControl(
    control
  ) {
    control.addClass('disabled');
  };

  CollapsibleCollection.prototype.enableControl = function enableControl(
    control
  ) {
    control.removeClass('disabled');
  };

  CollapsibleCollection.prototype.openCollapsibleForAnchor = function openCollapsibleForAnchor(
    anchor
  ) {
    var collapsible =
      this.getCollapsibleFromSection(anchor) ||
      this.getCollapsibleFromAnchorInSection(anchor);
    if (collapsible) {
      collapsible.open();
    }
  };

  CollapsibleCollection.prototype.getCollapsibleFromSection = function getCollapsibleFromSection(
    anchor
  ) {
    var collapsible = null;
    $.each(this.collapsibles, function(key, _collapsible) {
      if (key === anchor.substr(1)) {
        collapsible = _collapsible;
        return false;
      }
    });
    return collapsible;
  };

  CollapsibleCollection.prototype.getCollapsibleFromAnchorInSection = function getCollapsibleFromAnchorInSection(
    anchor
  ) {
    var section = $(anchor).closest('.js-openable')[0];

    var collapsible = null;
    $.each(this.collapsibles, function(key, _collapsible) {
      if (_collapsible.$section[0] === section) {
        collapsible = _collapsible;
        return false;
      }
    });
    return collapsible;
  };

  GOVUK.CollapsibleCollection = CollapsibleCollection;

  $('.js-collapsible-collection').each(function() {
    new GOVUK.CollapsibleCollection({ $el: $(this) });
  });

  // var $searchContainer = document.querySelector('[data-module="app-search"]');
  // new Search($searchContainer).init();

  var documents = [
    {
      name: 'Lunr',
      text: 'Like Solr, but much smaller, and not as bright.'
    },
    {
      name: 'React',
      text: 'A JavaScript library for building user interfaces.'
    },
    {
      name: 'Lodash',
      text:
        'A modern JavaScript utility library delivering modularity, performance & extras.'
    }
  ];

  var idx = lunr(function() {
    this.ref('name');
    this.field('text');

    documents.forEach(function(doc) {
      this.add(doc);
    }, this);
  });

  console.log(idx.search('javascript'));
});
