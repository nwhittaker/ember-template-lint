'use strict';

const AstNodeInfo = require('../helpers/ast-node-info');
const Rule = require('./base');

function hasAccessibleChild(node) {
  return AstNodeInfo.hasChildren(node);
}

module.exports = class A11yLintAltText extends Rule {
  logNode({ node, message }) {
    return this.log({
      message,
      line: node.loc && node.loc.start.line,
      column: node.loc && node.loc.start.column,
      source: this.sourceForNode(node),
    });
  }
  visitor() {
    return {
      ElementNode(node) {
        if (AstNodeInfo.hasAttribute(node, 'hidden')) {
          return;
        }

        if (AstNodeInfo.hasAttributeValue(node, 'aria-hidden', 'true')) {
          return;
        }

        const isImg = AstNodeInfo.isImgElement(node);
        const isObj = AstNodeInfo.isObjectElement(node);
        const isInput = AstNodeInfo.isInputElement(node);
        const isArea = AstNodeInfo.isAreaElement(node);

        if (isImg) {
          const hasAltAttribute = AstNodeInfo.hasAttribute(node, 'alt');
          const altValue = AstNodeInfo.elementAttributeValue(node, 'alt');
          const roleValue = AstNodeInfo.elementAttributeValue(node, 'role');

          if (!hasAltAttribute) {
            this.logNode({
              message: 'img tags must have an alt attribute',
              node,
            });
          } else {
            if (altValue === '') {
              if (['presentation', 'none'].includes(roleValue)) {
                return;
              }
              this.logNode({
                message:
                  'if the `alt` attribute is present and the value is an empty string, `role="presentation"` or `role="none"` must be present',
                node,
              });
            }
          }
        } else if (isInput) {
          const isImageInput = AstNodeInfo.hasAttributeValue(node, 'type', 'image');
          if (!isImageInput) {
            return;
          }
          const hasValidAttributes = AstNodeInfo.hasAnyAttribute(node, [
            'aria-label',
            'aria-labelledby',
            'alt',
          ]);

          if (!hasValidAttributes) {
            this.logNode({
              message:
                '<input> elements with type="image" must have a text alternative through the `alt`, `aria-label`, or `aria-labelledby` attribute.',
              node,
            });
          }
        } else if (isObj) {
          const hasValidAttributes = AstNodeInfo.hasAnyAttribute(node, [
            'aria-label',
            'aria-labelledby',
            'title',
          ]);

          if (hasValidAttributes || hasAccessibleChild(node)) {
            return;
          }

          this.logNode({
            message:
              'Embedded <object> elements must have alternative text by providing inner text, aria-label or aria-labelledby attributes.',
            node,
          });
        } else if (isArea) {
          if (!AstNodeInfo.hasAnyAttribute(node, ['aria-label', 'aria-labelledby', 'alt'])) {
            this.logNode({
              message:
                'Each area of an image map must have a text alternative through the `alt`, `aria-label`, or `aria-labelledby` attribute.',
              node,
            });
          }
        }
      },
    };
  }
};