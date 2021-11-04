// @ts-check

import { computeAccessibleName } from "dom-accessibility-api";
import { getImplicitAriaRoles, getNodeText, isInaccessible, isSubtreeInaccessible } from "./testing-library";

/**
 * @template T
 * @template U
 * @param {Iterable<T>} xs
 * @param {(x: T) => Iterable<U>} f
 */
function* collect(xs, f) {
    for (let x of xs) {
        for (let y of f(x)) {
            yield y;
        }
    }
}

/**
 * @param {Element} container
 */
function queryAll(container) {
    return collect(container.querySelectorAll('*'), node =>
        node.shadowRoot ? queryAll(node.shadowRoot) : [node])
}

/**
 * @param {Element} container
 * @param {string} role
 * @param {string} accessibleNamePattern
 */
export function getByRole(container, role, accessibleNamePattern) {
    const reg = new RegExp(accessibleNamePattern, "i");
    const subtreeIsInaccessibleCache = new WeakMap()
    function cachedIsSubtreeInaccessible(element) {
        if (!subtreeIsInaccessibleCache.has(element)) {
            subtreeIsInaccessibleCache.set(element, isSubtreeInaccessible(element))
        }

        return subtreeIsInaccessibleCache.get(element)
    }

    const candidates =
        Array.from(queryAll(container))
            .filter(node => {
                const isRoleSpecifiedExplicitly = node.hasAttribute('role')

                if (isRoleSpecifiedExplicitly) {
                    const roleValue = node.getAttribute('role')
                    const [firstWord] = roleValue.split(' ')
                    return role === firstWord;
                }

                const implicitRoles = getImplicitAriaRoles(node)
                return implicitRoles.some(implicitRole => role === implicitRole);
            })
            .filter(element => isInaccessible(element, {
                isSubtreeInaccessible: cachedIsSubtreeInaccessible,
            }) === false)
            .filter(element => reg.test(computeAccessibleName(element)))

    if (candidates.length === 0) {
        throw new Error(`Cannot find element with role "${role}" and accessible name matching /${accessibleNamePattern}/i`)
    }
    return candidates[0];
}

/**
 * @param {Element} el
 * @param {string} pattern
 */
export function getByText(el, pattern) {
    const reg = new RegExp(pattern, "i");
    for (let candidate of queryAll(el)) {
        if (reg.test(getNodeText(candidate))) {
            return candidate;
        }
    }
    throw new Error(`Cannot find element with text matching /${pattern}/i`)
}